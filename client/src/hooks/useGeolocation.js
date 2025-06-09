import { useState, useEffect } from "react";

export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }  

        const successHandler = (position) => {
            console.log("Geolocation success:", position.coords);
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            setError(null);
        };

        const errorHandler = (error) => {
            console.error("Geolocation error:", error);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setError('Please allow location access to find doctors near you');
                    break;
                case error.POSITION_UNAVAILABLE:
                    setError('Location information is unavailable');
                    break;
                case error.TIMEOUT:
                    setError('Location request timed out');
                    break;
                default:
                    setError('An unknown error occurred while getting location');
            }
        };

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);

    }, []);

    return { location, error };
};