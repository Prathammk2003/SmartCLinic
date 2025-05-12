"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import SlotAvailability from "./components/SlotAvailability";
import { toast } from "react-hot-toast";

export default function BookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({
    doctorId: "",
    slotId: "",
    type: "in-person",
    reason: "",
    symptoms: [],
    additionalNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [error, setError] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [slotUnavailableWarning, setSlotUnavailableWarning] = useState(false);

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await axios.get("/api/doctors");
        if (response.data && response.data.success) {
          setDoctors(response.data.data);
        } else {
          setError("Failed to load doctors. Please try again.");
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors. Please try again.");
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors based on search term and specialty
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearchTerm = 
      doctor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === "" || doctor.specialization === specialtyFilter;
    
    return matchesSearchTerm && matchesSpecialty;
  });
  
  // Get unique specialties for filter dropdown
  const specialties = [...new Set(doctors.map(doctor => doctor.specialization))];
  
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setBooking(prev => ({ ...prev, doctorId: doctor._id }));
    setStep(2);
  };
  
  // Handle slot availability changes
  const handleSlotAvailabilityChange = (isAvailable, slotId) => {
    if (isAvailable) {
      setBooking(prev => ({ ...prev, slotId }));
      setSlotUnavailableWarning(false);
    } else if (booking.slotId === slotId) {
      // Selected slot is no longer available
      setBooking(prev => ({ ...prev, slotId: "" }));
      setSlotUnavailableWarning(true);
      toast.error("The selected time slot is no longer available. Please select another slot.");
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSymptomsChange = (e) => {
    const value = e.target.value;
    setBooking(prev => ({
      ...prev,
      symptoms: value.split(',').map(symptom => symptom.trim())
    }));
  };
  
  const handleNextStep = () => {
    setStep(step + 1);
  };
  
  const handlePrevStep = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Verify slot is still available before proceeding to payment
      const slotResponse = await axios.get(`/api/doctors/${booking.doctorId}/slots`);
      if (slotResponse.data && slotResponse.data.success) {
        const slots = slotResponse.data.data;
        const isSlotAvailable = slots.some(slot => 
          slot._id === booking.slotId && slot.isAvailable
        );
        
        if (!isSlotAvailable) {
          setLoading(false);
          setSlotUnavailableWarning(true);
          setBooking(prev => ({ ...prev, slotId: "" }));
          setStep(2);
          toast.error("The selected time slot is no longer available. Please select another slot.");
          return;
        }
      }
      
      // If slot is available, proceed to payment page
      // Construct URL with query parameters
      const queryParams = new URLSearchParams({
        doctorId: booking.doctorId,
        slotId: booking.slotId,
        type: booking.type,
        reason: booking.reason,
        symptoms: booking.symptoms.join(','),
        notes: booking.additionalNotes
      }).toString();
      
      // Redirect to payment page
      router.push(`/appointments/payment?${queryParams}`);
      
    } catch (error) {
      console.error("Error proceeding to payment:", error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes("no longer available")) {
        setSlotUnavailableWarning(true);
        setBooking(prev => ({ ...prev, slotId: "" }));
        setStep(2);
        toast.error("The selected time slot is no longer available. Please select another slot.");
      } else {
        setError("There was an error processing your request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingDoctors && step === 1) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Loading doctors...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Book Your Appointment
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Find a doctor and schedule your visit with just a few clicks.
          </p>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className={`flex items-center relative ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'} flex items-center justify-center`}>
              1
            </div>
            <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-sm font-medium">
              Select Doctor
            </div>
          </div>
          <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${step >= 2 ? 'border-blue-600' : 'border-gray-300'}`}></div>
          <div className={`flex items-center relative ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'} flex items-center justify-center`}>
              2
            </div>
            <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-sm font-medium">
              Select Time Slot
            </div>
          </div>
          <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${step >= 3 ? 'border-blue-600' : 'border-gray-300'}`}></div>
          <div className={`flex items-center relative ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'} flex items-center justify-center`}>
              3
            </div>
            <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-sm font-medium">
              Enter Details
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4">
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
        )}
        
        {slotUnavailableWarning && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  The time slot you selected is no longer available. Please select another time slot.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Step 1: Select Doctor */}
          {step === 1 && (
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Doctor</h2>
                
                {/* Search and filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label htmlFor="search" className="sr-only">
                      Search doctors
                    </label>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      placeholder="Search by name or specialty"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-64">
                    <select
                      id="specialty"
                      name="specialty"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                    >
                      <option value="">All Specialties</option>
                      {specialties.map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Doctors list */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDoctors.length === 0 ? (
                    <p className="text-gray-500 col-span-3 text-center py-4">
                      No doctors found matching your criteria.
                    </p>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <div
                        key={doctor._id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-gray-900">{doctor.userId?.name || "Doctor"}</h3>
                          <p className="text-sm text-gray-500 mt-1">{doctor.specialization}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {doctor.experience} years experience
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 8a1 1 0 11-2 0 1 1 0 012 0zm-1-6a1 1 0 100 2 4 4 0 014 4 1 1 0 102 0 6 6 0 00-6-6z" clipRule="evenodd" />
                            </svg>
                            {doctor.qualifications?.join(", ") || "Qualified Professional"}
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{doctor.consultationFee || "0"} / consultation
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDoctorSelect(doctor)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Select Time Slot */}
          {step === 2 && selectedDoctor && (
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Time Slot</h2>
              
              <div className="mb-4">
                <p className="text-gray-700">
                  Selected Doctor: <span className="font-medium">{selectedDoctor.userId?.name || "Doctor"}</span> ({selectedDoctor.specialization})
                </p>
              </div>
              
              {/* Real-time slot availability component */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Available Slots</h3>
                <SlotAvailability 
                  doctorId={selectedDoctor._id}
                  selectedSlotId={booking.slotId}
                  onSlotAvailabilityChange={handleSlotAvailabilityChange}
                />
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Appointment Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    value={booking.type}
                    onChange={handleInputChange}
                  >
                    <option value="in-person">In-Person</option>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!booking.slotId}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!booking.slotId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason for visit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reason"
                    id="reason"
                    required
                    value={booking.reason}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-gray-900"
                    placeholder="e.g. Annual check-up, Fever, Headache"
                  />
                </div>
                
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                    Symptoms (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="symptoms"
                    id="symptoms"
                    value={booking.symptoms.join(', ')}
                    onChange={handleSymptomsChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-gray-900"
                    placeholder="e.g. Fever, Cough, Headache"
                  />
                </div>
                
                <div>
                  <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    rows={4}
                    value={booking.additionalNotes}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md text-gray-900"
                    placeholder="Any additional information that might be helpful for the doctor"
                  ></textarea>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment Summary</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Doctor:</strong> {selectedDoctor?.userId?.name || "Doctor"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {booking.type === 'in-person' ? 'In-Person' : booking.type === 'video' ? 'Video Call' : 'Phone Call'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 text-blue-600 font-medium">
                    Next step: Payment will be required to confirm your appointment.
                  </p>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !booking.reason}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || !booking.reason) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 