import { CarWriter } from "@ipld/car/writer";
import { importer, WritableStorage } from "ipfs-unixfs-importer";
import { CID } from "multiformats/cid";

/**
 * Browser-compatible CAR builder that creates a CAR file from File objects.
 * Used for Filecoin Pin uploads in the browser.
 */
interface BrowserCarBuildResult {
  rootCid: string;
  carBytes: Uint8Array;
  totalFiles: number;
  totalSize: number;
}

function isAsyncIterable<T>(input: unknown): input is AsyncIterable<T> {
  return typeof input === "object" && input !== null && Symbol.asyncIterator in input;
}

function isIterable<T>(input: unknown): input is Iterable<T> {
  return typeof input === "object" && input !== null && Symbol.iterator in input;
}

async function collectBytes(
  data: Uint8Array | AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
): Promise<Uint8Array> {
  if (data instanceof Uint8Array) {
    return data;
  }

  const chunks: Uint8Array[] = [];
  if (isAsyncIterable<Uint8Array>(data)) {
    for await (const chunk of data) {
      chunks.push(chunk);
    }
  } else if (isIterable<Uint8Array>(data)) {
    for (const chunk of data) {
      chunks.push(chunk);
    }
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const buffer = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}

class MemoryBlockstore {
  private readonly blocks = new Map<string, Uint8Array>();

  async put(cid: CID, bytes: Uint8Array | AsyncIterable<Uint8Array> | Iterable<Uint8Array>) {
    const normalized = await collectBytes(bytes);
    this.blocks.set(cid.toString(), normalized);
  }

  async get(cid: CID) {
    const block = this.blocks.get(cid.toString());
    if (!block) {
      throw new Error(`Missing block for CID ${cid.toString()}`);
    }
    return block;
  }

  async *entries() {
    for (const [key, bytes] of this.blocks.entries()) {
      yield { cid: CID.parse(key), bytes };
    }
  }

  async has(cid: CID) {
    return this.blocks.has(cid.toString());
  }

  clear() {
    this.blocks.clear();
  }
}

/**
 * Detects if all files share a common root folder prefix.
 * Returns the common prefix to strip, or empty string if no common prefix.
 */
function detectCommonRootFolder(files: File[]): string {
  const paths = files.map(
    (file) => (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
  );

  if (paths.length === 0) return "";

  // Get the first path segment of each file
  const firstSegments = paths.map((p) => {
    const segments = p.split("/");
    return segments.length > 1 ? segments[0] : "";
  });

  // Check if all files share the same root folder
  const commonRoot = firstSegments[0];
  if (!commonRoot) return "";

  const allShareRoot = firstSegments.every((seg) => seg === commonRoot);
  if (!allShareRoot) return "";

  return commonRoot;
}

async function* iterateBrowserFiles(
  files: File[],
  stripPrefix: string = "",
): AsyncGenerator<{ path: string; content: AsyncIterable<Uint8Array> }> {
  for (const file of files) {
    // Use webkitRelativePath for directory uploads, fallback to name for single files
    let filePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    // Strip the common root folder prefix if provided
    // e.g., "my-folder/subdir/file.txt" -> "subdir/file.txt"
    if (stripPrefix && filePath.startsWith(stripPrefix + "/")) {
      filePath = filePath.slice(stripPrefix.length + 1);
    }

    yield {
      path: filePath,
      content: file.stream() as unknown as AsyncIterable<Uint8Array>,
    };
  }
}

async function buildCarBytes(blockstore: MemoryBlockstore, rootCid: CID): Promise<Uint8Array> {
  const { writer, out } = await CarWriter.create([rootCid]);
  const chunks: Uint8Array[] = [];

  const collectOutput = (async () => {
    for await (const chunk of out) {
      chunks.push(chunk);
    }
  })();

  for await (const { cid, bytes } of blockstore.entries()) {
    await writer.put({ cid, bytes });
  }
  await writer.close();
  await collectOutput;

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function buildCarFromFiles(files: File[]): Promise<BrowserCarBuildResult> {
  // Detect if uploading a folder - if all files share a common root folder,
  // strip it so the root CID becomes the folder itself, not a wrapper around it.
  // e.g., "my-folder/file.txt" -> "file.txt" so root CID = my-folder
  const commonRootFolder = detectCommonRootFolder(files);

  // Check if this is a single file (no folder structure)
  // Single file = 1 file with no "/" in path (after stripping common root)
  const isSingleFile = files.length === 1 && !commonRootFolder;

  const blockstore = new MemoryBlockstore();
  let rootCid: CID | null = null;

  for await (const entry of importer(
    iterateBrowserFiles(files, commonRootFolder),
    blockstore as unknown as WritableStorage,
    {
      cidVersion: 1,
      // Don't wrap single files in a directory - root CID should be the file itself
      wrapWithDirectory: !isSingleFile,
      rawLeaves: true,
    },
  )) {
    rootCid = entry.cid;
  }

  if (!rootCid) {
    throw new Error("Failed to determine CAR root CID");
  }

  const carBytes = await buildCarBytes(blockstore, rootCid);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  blockstore.clear();

  return {
    rootCid: rootCid.toString(),
    carBytes,
    totalFiles: files.length,
    totalSize,
  };
}
