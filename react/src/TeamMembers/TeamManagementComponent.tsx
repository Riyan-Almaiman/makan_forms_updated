import React, { useState, useEffect } from 'react';
import {  User } from '../types';
import { userService } from '../services/userService';

const TeamManagementComponent: React.FC = () => {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [teameditors, setTeameditors] = useState<User[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSupervisors();
    fetchTeameditors();
  }, []);
useEffect(() => {
    setSelectedSupervisor(supervisors[0] || null);

  }, [supervisors]);
  const fetchSupervisors = async () => {
    try {
      const fetchedSupervisors = await userService.getUsersByRole('supervisor');
      setSupervisors(fetchedSupervisors);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchTeameditors = async () => {
    try {
      const fetchedTeameditors = await userService.getAllUsers();
      setTeameditors(fetchedTeameditors.filter(user => user.role !== 'supervisor'));
    } catch (error) {
      console.error('Error fetching Editors:', error);
    }
  };

  const handleSupervisorSelect = (supervisor: User) => {
    setSelectedSupervisor(supervisor);
    setSearchTerm('');
  };

  const handleAssignMember = async (member: User) => {
    if (selectedSupervisor && member.taqniaID !== selectedSupervisor.taqniaID) {
      try {
        await userService.updateSupervisor(member.taqniaID, selectedSupervisor.taqniaID);
        await fetchTeameditors();
      } catch (error) {
        console.error('Error assigning team member:', error);
      }
    }
  };

  const handleRemoveMember = async (member: User) => {
    try {
      await userService.updateSupervisor(member.taqniaID, null);
      await fetchTeameditors();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const filteredTeameditors = teameditors.filter(member => 
    (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.taqniaID.toString().includes(searchTerm)) &&
    member.supervisorTaqniaID !== selectedSupervisor?.taqniaID
  );

  const supervisorTeam = teameditors.filter(member => 
    member.supervisorTaqniaID === selectedSupervisor?.taqniaID
  );

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2  className="text-2xl font-bold text-[#196A58] mb-4">Team Management</h2>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Supervisors List */}
        <div className="w-full md:w-1/4">
          <h3 className="text-lg font-semibold mb-2">Supervisors</h3>
          <div className="bg-gray-100 p-2 rounded-lg h-[calc(100vh-200px)] overflow-y-auto">
          {supervisors.map(supervisor => (
              <div
                key={supervisor.taqniaID}
                className={`flex justify-between items-center p-3 mb-2 rounded-lg cursor-pointer ${
                  selectedSupervisor?.taqniaID === supervisor.taqniaID
                    ? 'bg-[#196A58] text-white'
                    : 'bg-white hover:bg-gray-200'
                }`}
                onClick={() => handleSupervisorSelect(supervisor)}
              >
                <div>
                  <p className="font-medium">{supervisor.name}</p>
                </div>
                <div className={`flex items-center space-x-1 ${
                  selectedSupervisor?.taqniaID === supervisor.taqniaID
                    ? 'text-white'
                    : 'text-[#196A58]'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="text-lg font-semibold">
                    {teameditors.filter(member => member.supervisorTaqniaID === supervisor.taqniaID).length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Supervisor's Team */}
        <div className="w-full md:w-2/3">
          <h3 className="text-lg font-semibold mb-2">
            {selectedSupervisor ? `${selectedSupervisor.name}'s Team` : 'Select a Supervisor'}
          </h3>
          <div className="bg-[#196A58]/15 p-2 rounded-lg h-[calc(100vh-200px)] overflow-y-auto">
            {supervisorTeam.map(member => (
              <div key={member.taqniaID} className="flex items-center shadow-md justify-between bg-white p-3 mb-2 rounded-lg">
                <div>
                  <p className="font-medium ">{member.name}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="btn btn-sm btn-outline btn-error"
                >
                  Remove
                </button>
              </div>
            ))}
            {supervisorTeam.length === 0 && selectedSupervisor && (
              <p className="text-center text-gray-500 mt-4">No Editors assigned yet.</p>
            )}
          </div>
        </div>

        {/* Available Editors */}
        <div className="w-full md:w-3/12">
          <h3 className="text-lg font-semibold mb-2">Available Editors ({filteredTeameditors.length})</h3>
          <input
            type="text"
            placeholder="Search available editors..."
            className="w-full p-2 mb-2 border focus:border-[#196A58]  rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="bg-gray-100 p-2 rounded-lg h-[calc(100vh-250px)] overflow-y-auto">
            {filteredTeameditors.map(member => (
              <div key={member.taqniaID} className="flex items-center justify-between bg-white p-2 mb-2 rounded-lg">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">
                    Current Supervisor: {supervisors.find(s => s.taqniaID === member.supervisorTaqniaID)?.name || 'None'}
                  </p>
                </div>
                <button
                  onClick={() => handleAssignMember(member)}
                  className="btn btn-sm btn-outline border-[#196A58] shadow-md  hover:bg-[#196A58] hover:text-white"
                  disabled={!selectedSupervisor || member.supervisorTaqniaID === selectedSupervisor.taqniaID}
                >
                  Assign
                </button>
              </div>
            ))}
            {filteredTeameditors.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No available Editors found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementComponent;