import React, { useState, useEffect } from "react";
import { User, Product, Role, Layer, ProductionRole } from "./types";
import { userService } from "./services/userService";
import { entityService } from "./services/entityService";
import SearchSelect from "./SearchSelect";
import CreateUserModal from "./CreateUserModal";

interface CreateUserProps {
  role: Role | undefined | null;
}



  const CreateUser: React.FC<CreateUserProps> = ({ role }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [layers, setLayers] = useState<Layer[]>([]);

    const [user, setUser] = useState<User | null>(null);
    const [originalUser, setOriginalUser] = useState<User | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const isSupervisor = role === Role.Supervisor;
  
    useEffect(() => {
      fetchUsers();
      fetchLayers();
      fetchProducts();
    }, []);
  
    const fetchUsers = async () => {
      try {
        const users = await userService.getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await entityService.getAllProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);0
      }
    };
    const fetchLayers = async () => {
      try {
        const fetchedProducts = await entityService.getAllLayers();
        setLayers(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);0
      }
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
    
      if (user) {
        if (name === "layerAssignment") {
          const selectedLayer = layers.find((layer) => layer.id === parseInt(value));
          setUser((prevUser) => ({
            ...prevUser!,
            layerAssignment: selectedLayer || undefined,  
          }));
        } else if (name === "productAssignment") {
          const selectedProduct = products.find((product) => product.id === parseInt(value));
          setUser((prevUser) => ({
            ...prevUser!,
            productAssignment: selectedProduct || undefined,  
          }));
        } else {
          setUser((prevUser) => ({
            ...prevUser!,
            [name]: name === "supervisorTaqniaID" ? (value ? parseInt(value) : undefined) : value,
          }));
        }
      }
      console.log(user)

    };
    
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (user) {
      try {
        await userService.updateUser(user.taqniaID, user);
        setUpdateMessage({ type: "success", text: "User updated successfully!" });
        // Update the user in the allUsers array
        setAllUsers(allUsers.map(u => u.taqniaID === user.taqniaID ? user : u));
      } catch (error) {
        console.error("Error editing user:", error);
        setUpdateMessage({ type: "error", text: `Error updating user: ${error}` });
      }
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  };

  const isUserChanged = () => {
    if (!user || !originalUser) return false;
    return JSON.stringify(user) !== JSON.stringify(originalUser);
  };

  const handleSelect = (selected: { value: string; label: string }) => {
    const selectedUser = allUsers.find(u => u.taqniaID.toString() === selected.value);
    if (selectedUser) {
      setUser({ ...selectedUser });
      setOriginalUser({ ...selectedUser });
    }
  };

  const supervisors = allUsers.filter(user => user.role === "supervisor");

  const userOptions = allUsers.map(user => ({
    value: user.taqniaID.toString(),
    label: user.name || user.username || ""
  }));


  return (
  <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg max-h-[calc(100vh-2rem)] overflow-hidden">
    <h2 className="text-2xl font-bold text-[#196A58] mb-4">User Management</h2>
    
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-10rem)]">
      {/* User Selection and Creation */}
      <div className="w-full md:w-1/4 mb-4 md:mb-0">
        <div className="bg-gray-100 p-3 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Select User</h3>
          <div className="flex flex-col space-y-2">
            <SearchSelect
              options={userOptions}
              onSelect={handleSelect}
              placeholder="Select user to edit..."
            />
            <button
              disabled={true}
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className={`${
                isSupervisor ? "cursor-not-allowed bg-gray-200" : "bg-[#196A58]"
              } text-white p-2 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 w-full flex items-center justify-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New User
            </button>
          </div>
        </div>
      </div>

      {/* User Edit Form */}
      <div className="w-full md:w-3/4">
        <div className="bg-gray-100 p-4 rounded-lg h-full overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Edit User</h3>
          {updateMessage && (
            <div className={`mb-4 p-2 rounded-lg ${updateMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {updateMessage.text}
            </div>
          )}
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">User Information</h4>
                  <div>
                    <label htmlFor="taqniaID" className="block text-sm font-medium text-gray-700">Taqnia ID</label>
                    <input
                      type="text"
                      id="taqniaID"
                      name="taqniaID"
                      value={user.taqniaID}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="nationalID" className="block text-sm font-medium text-gray-700">National ID</label>
                    <input
                      type="text"
                      id="nationalID"
                      name="nationalID"
                      value={user.nationalID || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={user.name || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={user.email || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={user.phoneNumber || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={user.username || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
{/* Project Information */}
<div className="space-y-4">
  <h4 className="text-md font-semibold">Project Information</h4>
  <div>
    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
    <select
      id="role"
      name="role"
      value={user.role || ""}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      <option value="">Select Role</option>
      <option value="admin">Admin</option>
      <option value="supervisor">Supervisor</option>
      <option value="editor">Editor</option>
      <option value="CEO">Dashboard</option>
    </select>
  </div>
  <div>
    <label htmlFor="employeeType" className="block text-sm font-medium text-gray-700">Employee Type</label>
    <input
      type="text"
      id="employeeType"
      name="employeeType"
      value={user.employeeType || ""}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    />
  </div>
  <div>
    <label htmlFor="supervisorTaqniaID" className="block text-sm font-medium text-gray-700">Supervisor</label>
    <select
      id="supervisorTaqniaID"
      name="supervisorTaqniaID"
      value={user.supervisorTaqniaID?.toString() || ""}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      <option value="">No Supervisor</option>
      {supervisors.map((supervisor) => (
        <option key={supervisor.taqniaID} value={supervisor.taqniaID.toString()}>
          {supervisor.name}
        </option>
      ))}
    </select>
  </div>
  <div>
    <label htmlFor="productAssignment" className="block text-sm font-medium text-gray-700">Product</label>
    <select
    required
      id="productAssignment"
      name="productAssignment"
      value={user.productAssignment?.id || ""}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      <option value="">Select Product</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </select>
  </div>
  <div>
    <label htmlFor="layerAssignment" className="block text-sm font-medium text-gray-700">Layer</label>
    <select
      id="layerAssignment"
      required
      name="layerAssignment"
      value={user.layerAssignment?.id || ""}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      <option value="">Select Layer</option>
      {layers.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.name}
        </option>
      ))}
    </select>
  </div>
  <div>
    <label htmlFor="productionRole" className="block text-sm font-medium text-gray-700">Production Role</label>
    <select
                        required
                        id="productionRole"
                        name="productionRole"
                        value={user.productionRole || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      >
                        <option value="">Select Production Role</option>
                        <option value={ProductionRole.Production as ProductionRole}>Production</option>
                        <option value={ProductionRole.DailyQC as ProductionRole}>Daily QC</option>
                        {/* <option value={ProductionRole.FinalQC as ProductionRole}>Final QC</option>
                        <option value={ProductionRole.FinalizedQC as ProductionRole}>Finalized QC</option> */}
                      </select>
  </div>
</div>
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!isUserChanged()}
                  className={`${
                    !isUserChanged() ? "bg-gray-300 cursor-not-allowed" : "bg-[#196A58] hover:bg-green-700"
                  } mt-4 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                >
                  Update User
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500">Select a user to edit their details.</p>
          )}
        </div>
      </div>
    </div>

    <CreateUserModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onUserCreated={(newUser) => {
        setAllUsers([...allUsers, newUser]);
        console.log("New user created:", newUser);
      }}
    />
  </div>
);
  }
export default CreateUser;