import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import logger from "./logger.js";

const uploadImage = async (imageData, options = {}) => {
	try {
		const uploadedResponse = await cloudinary.uploader.upload(imageData, options);
		return uploadedResponse.secure_url;
	} catch (error: any) {
		logger.error("Error uploading image to Cloudinary", error);
		throw new Error(error.message || "Image upload failed"); // Re-throw with actual error message
	}
};

// Enhanced file upload with accessibility verification
const uploadFile = async (filePath, options = {}) => {
	try {
		const defaultOptions = {
			resource_type: 'auto',
			access_mode: 'public',
			secure: true,
			use_filename: true,
			unique_filename: false,
			overwrite: false,
			invalidate: true,
			...options
		};

		const uploadedResponse = await cloudinary.uploader.upload(filePath, defaultOptions);

		// Verify file accessibility
		try {
			const verifyResponse = await axios.head(uploadedResponse.secure_url, {
				timeout: 5000,
				headers: {
					'User-Agent': 'Sociality-Verification/1.0'
				}
			});
			logger.info(`File uploaded and verified accessible: ${uploadedResponse.secure_url}`);
		} catch (verifyError: any) {
			logger.warn(`File uploaded but accessibility verification failed: ${verifyError.message}`);
			// Continue anyway as the file might still be accessible
		}

		return uploadedResponse;
	} catch (error: any) {
		logger.error("Error uploading file to Cloudinary", error);
		throw new Error(`File upload failed: ${error.message}`);
	}
};

// Verify if a Cloudinary URL is accessible
const verifyFileAccessibility = async (url) => {
	try {
		const response = await axios.head(url, {
			timeout: 10000,
			headers: {
				'User-Agent': 'Sociality-Verification/1.0'
			}
		});
		return {
			accessible: true,
			status: response.status,
			contentType: response.headers['content-type'],
			contentLength: response.headers['content-length']
		};
	} catch (error: any) {
		logger.warn(`File accessibility check failed for ${url}:`, error.message);
		return {
			accessible: false,
			error: error.message
		};
	}
};

const deleteImage = async (imageUrl) => {
	try {
		const imgId = imageUrl.split("/").pop().split(".")[0];
		await cloudinary.uploader.destroy(imgId);
	} catch (error) {
		logger.error("Error deleting image from Cloudinary", error);
		// Decide whether to re-throw or just log based on desired behavior
		// For now, just log and continue
	}
};

const deleteImages = async (imageUrls) => {
	if (!imageUrls || imageUrls.length === 0) {
		return;
	}
	for (const imageUrl of imageUrls) {
		await deleteImage(imageUrl); // Use the single delete function
	}
};

const uploadMultipleImages = async (images) => {
	const uploadedImages: string[] = [];
	if (!images || !Array.isArray(images) || images.length === 0) return uploadedImages;

	for (const imageData of images) {
		try {
			const url = await uploadImage(imageData);
			uploadedImages.push(url);
		} catch (error) {
			logger.error("Error in uploadMultipleImages, continuing with rest", error);
		}
	}
	return uploadedImages;
};

export { uploadImage, uploadMultipleImages, uploadFile, verifyFileAccessibility, deleteImage, deleteImages };
