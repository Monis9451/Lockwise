const Password = require('../models/passwords');
const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-ecb';

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), null);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText) => {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), null);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return '';
  }
};

const decryptAll = (encryptedArray) => {
    return encryptedArray.map(data => ({
      _id: data._id,
      site: decrypt(data.site),
      email: decrypt(data.email),
      password: decrypt(data.password),
      URL: data.URL ? decrypt(data.URL) : '',
      category: data.category ? decrypt(data.category) : ''
    }));
  };
  

const createPassword = async (req, res) => {
    try {
        let { site, email, password, URL, category } = req.body;
        if (site && email && password && URL && category) {
            site = encrypt(site);
            email = encrypt(email);
            password = encrypt(password);
            URL = encrypt(URL);
            category = encrypt(category);
        }

        const newPassword = new Password({ 
            site: site, 
            email: email, 
            password: password, 
            URL: URL, 
            category: category, 
            user: req.user.id
        });
        
        const savedPassword = await newPassword.save();
        const decryptedResponse = decryptAll([savedPassword])[0];
        
        res.status(201).json(decryptedResponse);
    } catch (error) {
        res.status(500).json({ message: 'Error creating password', error });
    }
};

const getPasswords = async (req, res) => {
    try {
        const passwords = await Password.find({ user: req.user.id });
        const decryptedPasswords = decryptAll(passwords);

        res.status(200).json({ passwords: decryptedPasswords });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching passwords', error });
    }
};

const editPassword = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = {...req.body};
        
        const fieldsToUpdate = {};
        if (updateData.site) fieldsToUpdate.site = encrypt(updateData.site);
        if (updateData.email) fieldsToUpdate.email = encrypt(updateData.email);
        if (updateData.password) fieldsToUpdate.password = encrypt(updateData.password);
        if (updateData.URL !== undefined) fieldsToUpdate.URL = updateData.URL ? encrypt(updateData.URL) : '';
        if (updateData.category !== undefined) fieldsToUpdate.category = updateData.category ? encrypt(updateData.category) : '';
        
        const updatedPassword = await Password.findOneAndUpdate(
            { _id: id, user: req.user.id },
            fieldsToUpdate,
            { new: true }
        );
        
        if (!updatedPassword) {
            return res.status(404).json({ message: 'Password not found' });
        }
        
        const decryptedResponse = decryptAll([updatedPassword])[0];
        
        res.status(200).json(decryptedResponse);
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error });
    }
};

const deletePassword = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Password ID is required' });
        }
        
        const deletedPassword = await Password.findOneAndDelete({ 
            _id: id, 
            user: req.user.id 
        });
        
        if (!deletedPassword) {
            return res.status(404).json({ message: 'Password not found or unauthorized' });
        }
        
        res.status(200).json({ 
            message: 'Password deleted successfully',
            deletedId: deletedPassword._id
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting password', 
            error: error.message 
        });
    }
};

module.exports = { createPassword, getPasswords, editPassword, deletePassword }