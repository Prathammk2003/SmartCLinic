"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Profile() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState({
    condition: "",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch user data from the API
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/user/profile');
        
        if (response.data && response.data.success) {
          setUserData(response.data.data);
          // Initialize form data with the user data
          setFormData(response.data.data);
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original user data
    setFormData(userData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleMedicalRecordChange = (e) => {
    const { name, value } = e.target;
    setMedicalRecord({
      ...medicalRecord,
      [name]: value
    });
  };

  const handleAddMedicalRecord = () => {
    if (!medicalRecord.condition || !medicalRecord.notes) {
      return;
    }

    const newMedicalHistory = [...(formData.medicalHistory || []), medicalRecord];
    
    setFormData({
      ...formData,
      medicalHistory: newMedicalHistory
    });
    
    // Reset the form
    setMedicalRecord({
      condition: "",
      notes: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Create a copy of form data for submission
      const dataToSubmit = { ...formData };
      
      // Handle address conversion from string to object if needed
      if (typeof dataToSubmit.address === 'string') {
        dataToSubmit.address = {
          street: dataToSubmit.address,
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };
      }
      
      const response = await axios.put('/api/user/profile', dataToSubmit);
      
      if (response.data && response.data.success) {
        setUserData(response.data.data);
        setIsEditing(false);
        // Show success message (you could add a toast notification here)
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
          <button 
            onClick={() => router.push('/dashboard')} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="mt-4 text-gray-500">No user data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your personal details and contact information.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {isEditing ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    value={formData.dateOfBirth?.split('T')[0] || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="address.street" className="block text-xs font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        value={formData.address?.street || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="address.city" className="block text-xs font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        value={formData.address?.city || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="address.state" className="block text-xs font-medium text-gray-700">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        value={formData.address?.state || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="address.zipCode" className="block text-xs font-medium text-gray-700">
                        Postal/ZIP Code
                      </label>
                      <input
                        type="text"
                        id="address.zipCode"
                        name="address.zipCode"
                        value={formData.address?.zipCode || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="address.country" className="block text-xs font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        id="address.country"
                        name="address.country"
                        value={formData.address?.country || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{userData.name || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                  <p className="mt-1 text-sm text-gray-900">{userData.email || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                  <p className="mt-1 text-sm text-gray-900">{userData.phone || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {userData.gender || "Not provided"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {userData.address ? (
                      <>
                        {userData.address.street && <span>{userData.address.street}<br /></span>}
                        {userData.address.city && userData.address.state && 
                          <span>{userData.address.city}, {userData.address.state} {userData.address.zipCode}<br /></span>
                        }
                        {!userData.address.city && userData.address.state && 
                          <span>{userData.address.state} {userData.address.zipCode}<br /></span>
                        }
                        {userData.address.city && !userData.address.state && 
                          <span>{userData.address.city} {userData.address.zipCode}<br /></span>
                        }
                        {userData.address.country && <span>{userData.address.country}</span>}
                        {/* If address is a string (old format), just display it */}
                        {typeof userData.address === 'string' && userData.address}
                      </>
                    ) : "Not provided"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Medical History</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your medical conditions and past treatments.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {(userData.medicalHistory && userData.medicalHistory.length > 0) ? (
              <div className="space-y-4">
                {userData.medicalHistory.map((record, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{record.condition}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{record.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medical history records.</p>
            )}

            {isEditing && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Add Medical Condition</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                      Condition
                    </label>
                    <input
                      type="text"
                      name="condition"
                      id="condition"
                      value={medicalRecord.condition}
                      onChange={handleMedicalRecordChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={medicalRecord.date}
                      onChange={handleMedicalRecordChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={medicalRecord.notes}
                      onChange={handleMedicalRecordChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedicalRecord}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Record
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your password and account security.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Password</h3>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-4">••••••••</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Change password
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-factor authentication</h3>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-4">Not enabled</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 