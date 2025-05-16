const FaceData = require('../models/FaceData');
const User = require('../models/users');

const saveFaceData = async (req, res) => {
    try {
        const { userId, descriptor } = req.body;

        if (!userId || !descriptor) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and face descriptor are required' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        let faceData = await FaceData.findOne({ userId });

        if (faceData) {
            faceData.faceDescriptors = [descriptor];
            await faceData.save();
        } else {
            faceData = new FaceData({
                userId,
                faceDescriptors: [descriptor]
            });
            await faceData.save();
        }

        res.status(201).json({ 
            success: true, 
            message: 'Face data saved successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

const checkFaceData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: 'User ID is required'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                faceRegistered: false 
            });
        }
        
        const faceData = await FaceData.findOne({ userId });
        
        if (faceData && faceData.faceDescriptors && faceData.faceDescriptors.length > 0) {
            return res.status(200).json({ 
                success: true,
                faceRegistered: true 
            });
        } else {
            return res.status(200).json({ 
                success: true,
                faceRegistered: false 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Internal server error', 
            error: error.message 
        });
    }
};

const verifyFaceData = async (req, res) => {
    try {
        const { userId, descriptor } = req.body;

        if (!userId || !descriptor) {
            return res.status(400).json({
                success: false,
                message: 'User ID and face descriptor are required',
            });
        }

        const faceData = await FaceData.findOne({ userId });

        if (!faceData || !faceData.faceDescriptors || faceData.faceDescriptors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No face data found for the user. Please setup your face recognition first.',
            });
        }

        const storedDescriptor = Array.isArray(faceData.faceDescriptors[0]) 
            ? faceData.faceDescriptors[0] 
            : Object.values(faceData.faceDescriptors[0]);
            
        const incomingDescriptor = Array.isArray(descriptor) 
            ? descriptor 
            : Object.values(descriptor);

        const distance = calculateEuclideanDistance(storedDescriptor, incomingDescriptor);
        
        const threshold = 0.45;
        
        if (distance < threshold) {
            if (distance < 0.35 && distance > 0.01) {
                const updatedDescriptor = calculateAverageDescriptor(storedDescriptor, incomingDescriptor);
                faceData.faceDescriptors[0] = updatedDescriptor;
                await faceData.save();
            }
            
            return res.status(200).json({
                success: true,
                message: 'Face verified successfully',
                distance: distance.toFixed(4),
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Face verification failed. Please ensure good lighting and try again.',
                distance: distance.toFixed(4),
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

function calculateEuclideanDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must be of the same length');
    }
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const valA = Number(a[i]);
        const valB = Number(b[i]);
        
        if (isNaN(valA) || isNaN(valB)) {
            continue;
        }
        
        const diff = valA - valB;
        sum += diff * diff;
    }
    
    return Math.sqrt(sum) || 0.0001;
}

function calculateAverageDescriptor(oldDescriptor, newDescriptor, weight = 0.8) {
    const result = [];
    
    for (let i = 0; i < oldDescriptor.length; i++) {
        const oldVal = Number(oldDescriptor[i]);
        const newVal = Number(newDescriptor[i]);
        
        if (isNaN(oldVal) || isNaN(newVal)) {
            result[i] = oldVal || newVal || 0;
        } else {
            result[i] = oldVal * weight + newVal * (1 - weight);
        }
    }
    
    return result;
}

module.exports = { saveFaceData, checkFaceData, verifyFaceData };
