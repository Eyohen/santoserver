const { Request, Response } = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const { uploadtocloudinary, uploadType } = require("../middleware/cloudinary");
const db = require("../models");
const { totalmem } = require("os");
const { Blog } = db;
const { Op } = require('sequelize');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});


	const create = async (req, res) => {
		try {
			// if (!req.body.user) {
			// 	return res.status(404).json({ msg: "User not found" });
			// }

			const {title, heading, text, imageUrl } = req.body;
			// Check if image was uploaded
			let imageurl = '';
			if (req.file) {
				console.log(req.file);
				// Upload image to Cloudinary
				const uploadresult = await uploadtocloudinary(req.file.buffer);
				if (uploadresult.message === "error") {
					throw new Error(uploadresult.error.message);
				}
				imageurl = uploadresult.url;
			}

			// create Blog record in the database
			const record = await Blog.create({ ...req.body, imageUrl: imageurl });
			return res.status(200).json({ record, msg: "Successfully create Blog" });
		} catch (error) {
			console.log("henry", error);
			return res.status(500).json({ msg: "fail to create", error });
		}
	}

	const readall = async (req, res) => {
		try {
			const limit = req.query.limit || 10;
			const offset = req.query.offset;

			const records = await Blog.findAll({
				// include:[{model:Purchase, as: 'Purchase'},{model:Review, as: 'Review'}]
			});
			return res.json(records);
		} catch (e) {
			return res.json({ msg: "fail to read", status: 500, route: "/read" });
		}
	}

	const readId = async (req, res) => {
		try {
			const { id } = req.params;
			const record = await Blog.findOne({ where: { id } });
			return res.json(record);
		} catch (e) {
			return res.json({ msg: "fail to read", status: 500, route: "/read/:id" });
		}
	}

	const readByUserId = async (req, res) => {
		try {
			const { userId } = req.params;
			const communities = await Blog.findAll({ where: { user: userId } });
			return res.json(communities);
		} catch (e) {
			return res.json({ msg: "fail to read", status: 500, route: "/read/user/:userId" });
		}
	}

	const update = async (req, res) => {
		try {
			const { title, heading, text } = req.body;

		// Prepare update object with only the fields that should be updated
		const updateData = {};
		if(title !== undefined) updateData.title = title;
		if(heading !== undefined) updateData.heading = heading;
		if(text !== undefined) updateData.text = text;

			// check if image was uploaded
			if(req.file){
				console.log(req.file);
				// Upload image to Cloudinary
				const uploadresult = await uploadtocloudinary(req.file.buffer);
				if(uploadresult.message === "error"){
					throw new Error(uploadresult.error.message);
				}
				updateData.imageUrl = uploadresult.url;
			}

		// Update the product with only the fields that were provided
			const [updated] = await Blog.update(updateData, { where: { id: req.params.id } });
			if (updated) {
				const updatedBlog = await Blog.findByPk(req.params.id);
				res.status(200).json(updatedBlog);
			} else {
				res.status(404).json({ message: 'Blog not found' });
			}
		} catch (error) {
			res.status(500).json({ message: 'Error updating the Blog', error });
		}
	}

	const deleteId = async (req, res) => {
		try {
			const { id } = req.params;
			const record = await Blog.findOne({ where: { id } });

			if (!record) {
				return res.json({ msg: "Can not find existing record" });
			}

			const deletedRecord = await record.destroy();
			return res.json({ record: deletedRecord });
		} catch (e) {
			return res.json({
				msg: "fail to read",
				status: 500,
				route: "/delete/:id",
			});
		}
	}


module.exports = {create, readall, readId, update, deleteId, readByUserId};