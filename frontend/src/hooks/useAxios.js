import { useState, useEffect } from 'react';
import api from '@/services/api';

/**
 * Custom hook for making axios requests with loading and error states
 * @param {Function} apiFunction - API function to call
 * @param {boolean} immediate - Whether to call immediately on mount
 */
export const useAxios = (apiFunction, immediate = false) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = async (...args) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFunction(...args);
            setData(response.data);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, []);

    return { data, loading, error, execute };
};

/**
 * Hook for handling file uploads with progress
 */
export const useFileUpload = () => {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const upload = async (url, formData) => {
        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            const response = await api.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                },
            });

            setUploading(false);
            return { success: true, data: response.data };
        } catch (err) {
            setUploading(false);
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    return { progress, uploading, error, upload };
};