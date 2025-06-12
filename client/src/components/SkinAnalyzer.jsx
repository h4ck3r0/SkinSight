import { useState } from 'react';
import axios from 'axios';
import { DISEASE_INFO } from '../constants/diseaseInfo';
import { DISEASE_MAPPING } from '../constants/diseaseMapping';
import { Link, useNavigate } from 'react-router-dom';

const SkinAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const ML_SERVICE_URL = 'https://skinsight-ml.onrender.com/predict'

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await axios.post(ML_SERVICE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const fullDiseaseName = DISEASE_MAPPING[response.data.prediction] || response.data.prediction;
      
      const diseaseInfo = DISEASE_INFO[fullDiseaseName] || {
        description: "Information not available",
        symptoms: [],
        treatment: "Please consult a healthcare professional",
        prevention: []
      };

      setPrediction({
        ...response.data,
        prediction: fullDiseaseName,
        ...diseaseInfo
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white bg-opacity-70 backdrop-blur-md fixed w-full z-10 top-0 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
                SkinSight
              </Link>
              <div className="hidden md:flex space-x-4">
                <button 
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-md transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => navigate('/patient')}
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-md transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/features')}
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 rounded-md transition-colors"
                >
                  Features
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-12 w-full">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Skin Condition Analyzer
            </h1>
            <p className="text-gray-600">
              Upload a photo to analyze your skin condition using AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-white bg-opacity-60 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-full">
                    <div className="flex justify-center w-full">
                      <label className="w-full cursor-pointer">
                        <div className="p-8 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 transition-colors">
                          <div className="flex flex-col items-center">
                            <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-600 text-center mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-gray-500 text-sm">
                              Supported formats: JPG, PNG
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                      </label>
                    </div>

                    {previewUrl && (
                      <div className="mt-6">
                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-600 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedImage || loading}
                      className={`mt-6 w-full py-3 px-4 rounded-xl text-white font-medium 
                        transition-all transform hover:scale-[1.02] ${
                          loading || !selectedImage 
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg'
                        }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </div>
                      ) : 'Analyze Image'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Results Section */}
            <div>
              {prediction ? (
                <div className="space-y-6">
                  <div className="bg-white bg-opacity-60 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Analysis Result
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xl text-blue-600 font-semibold">{prediction.prediction}</p>
                      <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {(prediction.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>

                    <div className="mt-6 space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">About this condition</h4>
                        <p className="text-gray-600">
                          {prediction.description}
                        </p>
                      </div>

                      {prediction.symptoms?.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-800 mb-2">Common Symptoms</h4>
                          <ul className="grid gap-2">
                            {prediction.symptoms.map((symptom, index) => (
                              <li key={index} className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">Treatment Options</h4>
                        <p className="text-gray-600">
                          {prediction.treatment}
                        </p>
                      </div>

                      {prediction.prevention?.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-800 mb-2">Prevention Tips</h4>
                          <ul className="grid gap-2">
                            {prediction.prevention.map((tip, index) => (
                              <li key={index} className="flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">Disclaimer:</span> This analysis is for informational 
                      purposes only and should not be considered as medical advice. Please consult a 
                      healthcare professional for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white bg-opacity-60 backdrop-blur-md rounded-2xl p-6 shadow-lg h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Upload an image to see analysis results</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinAnalyzer;