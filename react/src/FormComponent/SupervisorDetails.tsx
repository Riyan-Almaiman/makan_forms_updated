import { User } from "../types";

interface Props {
  supervisors: User[]; 
  supervisorTaqniaID: number | null | undefined;
}

const SupervisorDetails = ({ supervisors, supervisorTaqniaID }: Props) => {
  const supervisor = supervisors.find(
    (supervisor) => supervisor.taqniaID === supervisorTaqniaID
  );

  return (
    <div>
      <label htmlFor="supervisorName" className="block text-sm font-bold mb-2">
        Supervisor
      </label>
      <input
        type="text"
        id="supervisorName"
        name="supervisorName"
        value={supervisor ? supervisor.name ?? "" : "No Supervisor Assigned"}
        disabled
        className="w-full px-4 py-2 border bg-gray-100 border-gray-300 rounded-md"
      />
    </div>
  );
};

export default SupervisorDetails;
