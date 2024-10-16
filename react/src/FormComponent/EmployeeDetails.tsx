// src/components/EmployeeDetails.tsx


interface Props {
  name: string;
}

const EmployeeDetails = ({ name }: Props) => {
  return (
    <div>
      <label htmlFor="employeeName" className="block text-gray-700 text-sm font-bold mb-2">
        Employee Name
      </label>
      <input
        type="text"
        id="employeeName"
        name="employeeName"
        value={name || ""} 
        disabled
        className="w-full px-4 py-2 border bg-gray-100 border-gray-300 rounded-md"
      />
    </div>
  );
};

export default EmployeeDetails;
