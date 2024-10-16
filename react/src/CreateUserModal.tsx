import React, { useState, useEffect } from "react";
import { User, Product, ProductionRole } from "./types";
import { userService } from "./services/userService";
import { entityService } from "./services/entityService";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}
enum Roles {
    Admin = 'admin',
    Supervisor = 'supervisor',
    Editor = 'editor',
    Dashboard = "CEO"
  
}
const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [user, setUser] = useState<User>({
    taqniaID: 0,
    nationalID: "",
    name: "",
    productionRole: ProductionRole.Production,
    product: "",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    role: "",
    employeeType: "",
    supervisorTaqniaID: null,
  });

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await entityService.getAllProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: name === "taqniaID" || name === "supervisorTaqniaID" ? parseInt(value) || null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const createdUser = await userService.createUser(user);
      onUserCreated(createdUser);
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user: " + error);
    }
  };

  return (
    <dialog id="create_user_modal" className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="taqniaID">
              <span className="label-text">Taqnia ID</span>
            </label>
            <input
              type="number"
              id="taqniaID"
              name="taqniaID"
              value={user.taqniaID || ''}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="name">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={user.name || ''}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email || ''}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="phoneNumber">
              <span className="label-text">Phone Number</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={user.phoneNumber || ''}
              onChange={handleInputChange}
              className="input input-bordered w-full"
            />
          </div><div className="form-control w-full mb-4">
            <label className="label" htmlFor="nationalID">
              <span className="label-text">National ID</span>
            </label>
            <input
              type="tel"
              id="nationalID"
              name="nationalID"
              value={user.nationalID || ''}
              onChange={handleInputChange}
              className="input input-bordered w-full"
            />
          </div>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="role">
              <span className="label-text">Role</span>
            </label>
            <select
              id="role"
              name="role"
              value={user.role || ''}
              onChange={handleInputChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Role</option>
              {Object.values(Roles).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="form-control w-full mb-4">
            <label className="label" htmlFor="product">
              <span className="label-text">Product</span>
            </label>
            <select
              id="product"
              name="product"
              value={user.product || ''}
              onChange={handleInputChange}
              className="select select-bordered w-full"
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn bg-[#196A58] text-gray-100">Create User</button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default CreateUserModal;