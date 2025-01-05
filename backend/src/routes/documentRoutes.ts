import express, { Router } from 'express';
import { documentController } from '../controllers/documentController';
const router: Router = express.Router();

// Route to request presigned URLs for upload
router.post('/request-upload', documentController.requestUpload);

// Route to confirm upload completion
router.post('/confirm-upload', documentController.confirmUpload);

// Route to get documents for a user
router.get('/get-documents-by-email', documentController.getDocuments);

// Route to get document access link by s3 key
router.get('/get-document-access-link', documentController.getDocumentAccessLinkByS3Key);



// a route to delete a document by s3 key
router.delete('/delete-document-by-s3-key', documentController.deleteDocumentByS3Key);

export default router;
