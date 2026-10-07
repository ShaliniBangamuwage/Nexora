import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";

const CATEGORIES = [
  "Laptops",
  "Smartphones",
  "Audio",
  "Wearables",
  "Accessories",
];

const inputCls = (err) =>
  `w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-800 outline-none transition-all
   disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed
   ${
     err
       ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
       : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
   }`;

const Field = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = true,
  disabled,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-bold text-slate-800">
      {label} {required && <span className="text-red-500">*</span>}
      {!required && (
        <span className="text-slate-400 font-normal"> (Optional)</span>
      )}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputCls(error)}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

const PasswordRequirements = ({ password }) => {
  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least one number", met: /[0-9]/.test(password) },
    {
      label: "At least one special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
  ];
  return (
    <div className="mt-1 flex flex-col gap-1">
      {rules.map((rule) => (
        <div key={rule.label} className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${rule.met ? "text-emerald-500" : "text-slate-400"}`}
          >
            {rule.met ? "✓" : "✗"}
          </span>
          <span
            className={`text-xs ${rule.met ? "text-emerald-600" : "text-slate-400"}`}
          >
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const PasswordField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = true,
  disabled,
  showReqs = false,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && (
          <span className="text-slate-400 font-normal"> (Optional)</span>
        )}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputCls(error) + " pr-11"}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
      {showReqs && value.length > 0 && (
        <PasswordRequirements password={value} />
      )}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const role = "customer";
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Customer fields
  const [formData, setFormData] = useState({
    // shared
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // supplier only
    contactPerson: "",
    businessRegNo: "",
    businessAddress: "",
    categories: [],
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleCategory = (cat) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Sri Lanka phone: 07XXXXXXXX or +94XXXXXXXXX
  const validatePhone = (phone) =>
    /^(\+94)[0-9]{9}$/.test(phone) || /^07[0-9]{8}$/.test(phone);

  const validatePassword = (password, errs, field = "password") => {
    if (!password) errs[field] = "Password is required";
    else if (password.length < 8) errs[field] = "Minimum 8 characters";
    else if (!/[A-Z]/.test(password))
      errs[field] = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(password)) errs[field] = "Must contain a number";
    else if (!/[!@#$%^&*]/.test(password))
      errs[field] = "Must contain a special character (!@#$%^&*)";
  };

  const validate = () => {
    const e = {};

    if (role === "customer") {
      if (!formData.fullName.trim()) e.fullName = "Full name is required";
      if (!formData.email.trim()) e.email = "Email is required";
      else if (!validateEmail(formData.email))
        e.email = "Invalid email address";
      validatePassword(formData.password, e);
      if (!formData.confirmPassword)
        e.confirmPassword = "Please confirm password";
      else if (formData.password !== formData.confirmPassword)
        e.confirmPassword = "Passwords do not match";
      // Phone is optional but must be valid format if provided
      if (formData.phone.trim() && !validatePhone(formData.phone.trim()))
        e.phone = "Enter a valid phone number (e.g. 0771234567 or +94771234567)";
    }

    if (role === "supplier") {
      if (!formData.companyName.trim())
        e.companyName = "Company name is required";
      if (!formData.email.trim()) e.email = "Email is required";
      else if (!validateEmail(formData.email))
        e.email = "Invalid email address";
      if (!formData.contactPerson.trim())
        e.contactPerson = "Contact person is required";
      if (!formData.phone.trim()) {
        e.phone = "Phone number is required";
      } else if (!validatePhone(formData.phone.trim())) {
        e.phone = "Enter a valid phone number (e.g. 0771234567 or +94771234567)";
      }
      if (!formData.businessRegNo.trim())
        e.businessRegNo = "Business registration number is required";
      else if (formData.businessRegNo.trim().length < 5)
        e.businessRegNo = "Enter a valid registration number (min 5 characters)";
      if (!formData.businessAddress.trim())
        e.businessAddress = "Business address is required";
      if (!formData.bankName.trim()) e.bankName = "Bank name is required";
      if (!formData.accountNumber.trim()) {
        e.accountNumber = "Account number is required";
      } else if (!/^[0-9]{8,16}$/.test(formData.accountNumber.trim())) {
        e.accountNumber = "Account number must be 8–16 digits only";
      }
      if (!formData.accountHolderName.trim())
        e.accountHolderName = "Account holder name is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      // Pass formData directly with role
      await register({ ...formData, role });

      if (role === "customer") {
        setSuccessMessage("Registration successful! Welcome to NEXORA.");
        setTimeout(() => navigate("/customer"), 1500);
      } else {
        navigate("/register-success");
      }
    } catch (error) {
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-400 px-4 py-8 relative overflow-hidden">
      <div className="absolute top-[-90px] right-[-90px] w-72 h-72 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-140px] left-[-140px] w-96 h-96 rounded-full bg-white/10 animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 right-[8%] w-52 h-52 rounded-full bg-white/10 animate-pulse pointer-events-none" />

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg px-6 sm:px-10 py-8 sm:py-12 animate-[slideUp_0.5s_ease]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
            NEXORA
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Electronics & Tech Gadgets Store
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-7">
          <Link
            to="/login"
            className="flex-1 py-3 rounded-xl text-center text-sm font-bold border-2 border-slate-200 bg-slate-50 text-slate-500 hover:bg-blue-50 transition-colors"
          >
            Login
          </Link>
          <span className="flex-1 py-3 rounded-xl text-center text-sm font-bold bg-gradient-to-r from-blue-900 to-blue-500 text-white shadow-md shadow-blue-300/50">
            Register
          </span>
        </div>

        {/* Success */}
        {successMessage && (
          <div className="flex items-start gap-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-xl px-5 py-4 mb-6 text-sm font-medium">
            <span className="text-lg">✓</span>
            {successMessage}
          </div>
        )}

        {/* Error */}
        {errors.submit && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm font-medium">
            <span className="text-lg">⚠</span>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ── CUSTOMER FIELDS ── */}
          {role === "customer" && (
            <>
              <Field
                label="Full Name"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required={false}
              />
              <PasswordField
                label="Password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                showReqs={true}
              />
              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
            </>
          )}

          {/* ── SUPPLIER FIELDS ── */}
          {role === "supplier" && (
            <>
              <Field
                label="Company Name"
                name="companyName"
                placeholder="e.g. ABC Pharmaceuticals Ltd"
                value={formData.companyName}
                onChange={handleChange}
                error={errors.companyName}
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                placeholder="company@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
              <Field
                label="Contact Person Name"
                name="contactPerson"
                placeholder="Contact person full name"
                value={formData.contactPerson}
                onChange={handleChange}
                error={errors.contactPerson}
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <Field
                label="Business Registration Number"
                name="businessRegNo"
                placeholder="e.g. PV/00123/2020"
                value={formData.businessRegNo}
                onChange={handleChange}
                error={errors.businessRegNo}
              />
              <Field
                label="Business Address"
                name="businessAddress"
                placeholder="Full business address"
                value={formData.businessAddress}
                onChange={handleChange}
                error={errors.businessAddress}
              />

              {/* Categories */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-800">
                  Product Categories{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      disabled={loading}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all disabled:opacity-50
                        ${
                          formData.categories.includes(cat)
                            ? "bg-gradient-to-r from-blue-900 to-blue-500 text-white border-blue-500"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Bank Name"
                name="bankName"
                placeholder="e.g. Commercial Bank"
                value={formData.bankName}
                onChange={handleChange}
                error={errors.bankName}
              />
              <Field
                label="Account Number"
                name="accountNumber"
                placeholder="e.g. 1234567890"
                value={formData.accountNumber}
                onChange={handleChange}
                error={errors.accountNumber}
              />
              <Field
                label="Account Holder Name"
                name="accountHolderName"
                placeholder="Name on bank account"
                value={formData.accountHolderName}
                onChange={handleChange}
                error={errors.accountHolderName}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-500 text-white text-base font-extrabold shadow-lg shadow-blue-400/40 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {role === "customer"
                  ? "Creating Account..."
                  : "Submitting Request..."}
              </span>
            ) : role === "customer" ? (
              "Create Account"
            ) : (
              "Submit Request"
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Register;
