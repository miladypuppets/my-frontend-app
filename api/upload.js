// api/upload.js

import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data';
import { Writable } from 'stream'; // Import 'Writable' from 'stream'

export const config = {
  api: {
    bodyParser: false, // Disables default body parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const buffers = [];

  const form = formidable({
    multiples: false,
    keepExtensions: false,
    // Use memory storage
    fileWriteStreamHandler: () => {
      const writable = new Writable({
        write(chunk, encoding, callback) {
          buffers.push(chunk);
          callback();
        },
      });
      return writable;
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    if (buffers.length === 0) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const fileBuffer = Buffer.concat(buffers);

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: 'uploaded_file', // Adjust as needed
        contentType: 'application/octet-stream', // Adjust if known
      });

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_API_SECRET,
          },
        }
      );

      res.status(200).json({ cid: response.data.IpfsHash });
    } catch (uploadError) {
      console.error(
        'Failed to upload to Pinata:',
        uploadError.response ? uploadError.response.data : uploadError.message
      );
      res.status(500).json({
        error: 'Failed to upload to Pinata',
        details: uploadError.response
          ? uploadError.response.data
          : uploadError.message,
      });
    }
  });
}
