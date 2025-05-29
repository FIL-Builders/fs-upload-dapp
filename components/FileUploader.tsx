'use client';
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Synapse } from '@filecoin-project/synapse-sdk';

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isConnected } = useAccount();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleSubmit = () => {
    if (!file) return;
    //  upload file here using synapse-sdk
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer =  provider.getSigner();

    //Initialize Synapse with Wallet signer
    const synapse = new Synapse(signer);

    //Create storage service instance
    const fsStorage = await synapse.createStorage();

    //Upload File
    const uploadTask = fsStorage.uploadFile(file);

    //Wait for upload to complete
    const commp = await uploadTask.commp()
    console.log(`Generated CommP: ${commp}`)
    
    const sp = await uploadTask.store()
    console.log(`Stored data with provider: ${sp}`)
    
    const txHash = await uploadTask.done()
    console.log(`Blob committed on chain: ${txHash}`)

    console.log('Uploading file:', file);
  };

  const handleReset = () => {
    setFile(null);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium">
            {file ? file.name : 'Drop your file here, or click to select'}
          </p>
          {!file && (
            <p className="text-sm text-gray-500">
              Drag and drop your file, or click to browse
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={!file}
          className={`px-6 py-2 rounded-[20px] text-center border-2 border-black transition-all ${
            file
              ? 'bg-black text-white hover:bg-white hover:text-black'
              : 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
        <button
          onClick={handleReset}
          disabled={!file}
          className={`px-6 py-2 rounded-[20px] text-center border-2 transition-all ${
            file
              ? 'border-black text-black hover:bg-black hover:text-white'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}