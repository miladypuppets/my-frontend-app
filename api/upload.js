// api/upload.js

import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parser
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form data:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const fileData = fs.readFileSync(file.filepath);

      const formData = new FormData();
      formData.append('file', fileData, file.originalFilename);

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
      console.error('Failed to upload to Pinata:', uploadError.message);
      res.status(500).json({
        error: 'Failed to upload to Pinata',
        details: uploadError.message,
      });
    }
  });
}
