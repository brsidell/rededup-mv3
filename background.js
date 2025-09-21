"use strict";

// MV3 Change: Import the hashing scripts directly into the service worker's
// scope. This makes their functions available globally within this script.
// We assume 'phash.js' contains the 'fetchImageAndGetHash' function.
try {
  importScripts('dct.js', 'dwt.js', 'phash.js');
} catch (e) {
  console.error("Failed to import hashing scripts:", e);
}

/**
 * Convert an ArrayBuffer to a base64-encoded string.
 *
 * @param {ArrayBuffer} buffer ArrayBuffer containing data to encode.
 * @return {String} Base64-encoded string.
 */
function bufToBase64(buffer) {
  // This function is standard JavaScript and requires no changes.
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// MV3 Change: Switched from 'browser.runtime' to 'chrome.runtime' for the
// official Chrome namespace. The async listener pattern is fully supported.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Make sure we are responding to a message from our content script
  if (message.type === 'hashImage') {
    handleImageHashing(message, sender)
      .then(sendResponse)
      .catch(error => {
        console.warn("Error during hashing:", message, error);
        sendResponse({ error: "Failed to get image hash" });
      });
  }
  
  // Return true to indicate that we will send a response asynchronously.
  return true; 
});

async function handleImageHashing(message, sender) {
  const url = new URL(message.url, sender.url);

  // For security, make sure the requested domain is valid
  if (!url.hostname.endsWith('.thumbs.redditmedia.com')) {
    throw new Error("Invalid domain: " + url.hostname);
  }

  // Also make sure to use HTTPS
  url.protocol = 'https:';

  // This assumes the fetchImageAndGetHash function is available from the
  // imported scripts.
  const hash = await fetchImageAndGetHash(url.href, message.hashFunction);
  return { hash: bufToBase64(hash) };
}
