"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function SlotAvailability({ doctorId, selectedSlotId, onSlotAvailabilityChange }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newSlotIds, setNewSlotIds] = useState([]);

  // Fetch available slots initially and then poll for updates
  useEffect(() => {
    if (!doctorId) {
      console.log("No doctorId provided to SlotAvailability component");
      return;
    }
    
    console.log("Fetching slots for doctor:", doctorId);
    
    const fetchSlots = async () => {
      setLoading(true);
      try {
        console.log("Making API call to get slots:", `/api/doctors/${doctorId}/slots`);
        const response = await axios.get(`/api/doctors/${doctorId}/slots`);
        console.log("Slots API response:", response.data);
        
        if (response.data && response.data.success) {
          const slots = response.data.data.filter(slot => slot.isAvailable);
          console.log(`Found ${slots.length} available slots out of ${response.data.data.length} total slots`);
          
          // Check if slots have changed
          if (availableSlots.length > 0) {
            // Visual indicator for changed slots - highlight newly added slots
            const previousSlotIds = availableSlots.map(slot => slot._id);
            const newSlots = slots.filter(slot => !previousSlotIds.includes(slot._id));
            
            if (newSlots.length > 0) {
              console.log("New slots found:", newSlots.length);
              // Set newly added slots for animation
              setNewSlotIds(newSlots.map(slot => slot._id));
              
              // Clear the animation after 3 seconds
              setTimeout(() => {
                setNewSlotIds([]);
              }, 3000);
            }
            
            // Check for removed slots
            const currentSlotIds = slots.map(slot => slot._id);
            const removedSlots = availableSlots.filter(slot => !currentSlotIds.includes(slot._id));
            
            if (removedSlots.length > 0) {
              console.log("Some slots are no longer available:", removedSlots.length);
            }
          }
          
          setAvailableSlots(slots);
          setLastUpdated(new Date());
          setError(""); // Clear any previous errors
          
          // Check if the selected slot is still available
          if (selectedSlotId) {
            const isStillAvailable = slots.some(slot => slot._id === selectedSlotId);
            if (!isStillAvailable) {
              console.log("Selected slot is no longer available:", selectedSlotId);
              onSlotAvailabilityChange(false, selectedSlotId);
            }
          }
        } else {
          console.error("API returned error:", response.data);
          setError(response.data?.message || "Failed to load available slots");
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setError(`Failed to load available slots: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSlots();

    // Set up polling for real-time updates (every 15 seconds)
    const pollingInterval = setInterval(fetchSlots, 15000);

    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [doctorId, selectedSlotId, onSlotAvailabilityChange]);

  // Format time for display
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Group slots by date for display
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const date = new Date(slot.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  if (loading && availableSlots.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-500">Loading available slots...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No available time slots for this doctor. Please check back later or contact the doctor directly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lastUpdated && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <div className={`flex items-center ${loading ? 'text-blue-600' : 'text-green-600'}`}>
            {loading ? (
              <>
                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-time updates on
              </>
            )}
          </div>
        </div>
      )}

      {Object.entries(slotsByDate).map(([date, slots]) => (
        <div key={date} className="mb-4">
          <h4 className="text-md font-medium text-gray-900 mb-2">
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <div
                key={slot._id}
                className={`py-2 px-4 rounded-md text-sm font-medium 
                  ${selectedSlotId === slot._id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  } cursor-pointer transition duration-150 ease-in-out
                  ${newSlotIds.includes(slot._id) ? "animate-pulse border-2 border-green-500" : ""}
                `}
                onClick={() => onSlotAvailabilityChange(true, slot._id)}
              >
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                {newSlotIds.includes(slot._id) && (
                  <span className="ml-1 text-xs text-green-600 font-bold">New</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 