import React from 'react';

/**
 * Component to capture customer billing information.
 * All inputs are required as per the order processing logic.
 */
const DISTRICTS_CITIES = {
    "Colombo": ["Colombo 01-15", "Dehiwala", "Mount Lavinia", "Moratuwa", "Kotte", "Maharagama", "Kesbewa", "Battaramulla", "Kaduwela", "Homagama", "Kolonnawa", "Hanwella", "Avissawella", "Padukka", "Mulleriyawa", "Malabe", "Athurugiriya", "Pannipitiya", "Rajagiriya", "Nugegoda", "Kottawa"],
    "Gampaha": ["Gampaha", "Negombo", "Katunayake", "Wattala", "Kelaniya", "Ja-Ela", "Kadawatha", "Kiribathgoda", "Ragama", "Biyagama", "Delgoda", "Divulapitiya", "Mirigama", "Minuwangoda", "Veyangoda", "Nittambuwa", "Kirindiwela", "Ganemulla", "Kandana"],
    "Kalutara": ["Kalutara", "Panadura", "Horana", "Beruwala", "Matugama", "Aluthgama", "Bandaragama", "Wadduwa", "Agalawatte", "Bulathsinhala", "Dodangoda", "Ingiriya", "Paiyagala"],
    "Kandy": ["Kandy", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya", "Wattegama", "Kundasale", "Akurana", "Digana", "Kadugannawa", "Madawala", "Teldeniya", "Pilimathalawa", "Menikhinna", "Galagedara"],
    "Galle": ["Galle", "Hikkaduwa", "Karapitiya", "Ambalangoda", "Elpitiya", "Baddegama", "Bentota", "Habaraduwa", "Hiniduma", "Neluwa", "Ahangama", "Batapola", "Karandeniya"],
    "Matara": ["Matara", "Weligama", "Akuressa", "Dickwella", "Deniyaya", "Kamburupitiya", "Kekanadurra", "Kotapola", "Hakmana", "Gandara", "Kamburugamuwa"],
    "Kurunegala": ["Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Alawwa", "Bingiriya", "Galgamuwa", "Giriulla", "Hettipola", "Ibbagamuwa", "Mawathagama", "Polgahawela", "Nikaweratiya", "Maho"],
    "Anuradhapura": ["Anuradhapura", "Eppawala", "Mihintale", "Kekirawa", "Thalawa", "Habarana", "Medawachchiya", "Padaviya", "Tambuttegama", "Galenbindunuwewa", "Nochchiyagama"],
    "Ratnapura": ["Ratnapura", "Balangoda", "Eheliyagoda", "Kuruwita", "Pelmadulla", "Embilipitiya", "Godakawela", "Kalawana", "Rakwana", "Ayagama", "Kahawatta", "Pannala"],
    "Kegalle": ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Dehiowita", "Deraniyagala", "Galigamuwa", "Kitulgala", "Ruwanwella", "Yatiyantota", "Bulathkohupitiya"],
    "Badulla": ["Badulla", "Bandarawela", "Hali-Ela", "Haputale", "Mahiyanganaya", "Welimada", "Diyatalawa", "Ella", "Passara", "Diyatalawa", "Lunugala"],
    "Hambantota": ["Hambantota", "Tangalle", "Beliatta", "Ambalantota", "Tissamaharama", "Angunakolapelessa", "Kataragama", "Walasmulla", "Weeraketiya", "Middeniya"],
    "Puttalam": ["Puttalam", "Chilaw", "Wennappuwa", "Marawila", "Dankotuwa", "Anamaduwa", "Kalpitiya", "Madampe", "Nattandiya", "Mundel"],
    "Jaffna": ["Jaffna", "Chavakachcheri", "Point Pedro", "Nallur", "Chunnakam", "Karainagar", "Kayts", "Kopay", "Tellippalai", "Vaddukoddai", "Manipay"],
    "Trincomalee": ["Trincomalee", "Kinniya", "Mutur", "Kantale", "Kuchchaveli", "Serunuwara"],
    "Batticaloa": ["Batticaloa", "Eravur", "Kattankudy", "Chenkalady", "Kaluwanchikudy", "Valaichchenai", "Oddamavadi"],
    "Ampara": ["Ampara", "Samanthurai", "Kalmunai", "Akkaraipattu", "Mahaoya", "Pottuvil", "Uhana", "Sainthamaruthu", "Dehiattakandiya"],
    "Matale": ["Matale", "Dambulla", "Sigiriya", "Galewela", "Rattota", "Ukuwela", "Pallepola", "Yatawatta"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Ginigathena", "Kotmale", "Maskeliya", "Walapane", "Agrapatana", "Pundaluoya"],
    "Polonnaruwa": ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda", "Welikanda", "Aralaganwila", "Bakamuna"],
    "Moneragala": ["Moneragala", "Wellawaya", "Buttala", "Bibile", "Kataragama", "Medagama", "Tanamanwila", "Siyambalanduwa"],
    "Vavuniya": ["Vavuniya", "Cheddikulam", "Nedunkeni"],
    "Mannar": ["Mannar", "Adampan", "Madhu", "Murunkan", "Nanattan", "Talaimannar"],
    "Mullaitivu": ["Mullaitivu", "Oddusuddan", "Puthukkudiyiruppu", "Mankulam", "Mallavi"],
    "Kilinochchi": ["Kilinochchi", "Paranthan", "Poonakary", "Pallai"]
};

const BillingDetails = ({ formData, handleInputChange, originalProfileAddress, errors = {}, isLoading = false }) => {
    const districts = Object.keys(DISTRICTS_CITIES).sort();
    const cities = formData.district ? DISTRICTS_CITIES[formData.district] || [] : [];

    // Determine if address has changed or is missing in profile
    const isAddressMissingOrChanged = () => {
        if (!originalProfileAddress) return false;
        
        const isMissing = !originalProfileAddress.district || !originalProfileAddress.city || !originalProfileAddress.houseNumber || !originalProfileAddress.laneStreet;
        
        if (isMissing) return true;

        const hasChanged = 
            formData.district !== originalProfileAddress.district ||
            formData.city !== originalProfileAddress.city ||
            formData.houseNumber !== originalProfileAddress.houseNumber ||
            formData.laneStreet !== originalProfileAddress.laneStreet;
            
        return hasChanged;
    };

    const showSaveProfileCheck = isAddressMissingOrChanged() && formData.district && formData.city && formData.houseNumber && formData.laneStreet;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 rounded-2xl p-7 bg-white border border-slate-200" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <header className="relative mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-1">Information</p>
                <h2 className="text-xl font-black text-slate-900">
                    Billing Details
                </h2>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
                {/* Contact Information */}
                <div className="md:col-span-2 group">
                    <label className="block text-[13px] font-bold mb-2 text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
                        Email address *
                    </label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`} 
                        placeholder="Enter your email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.email}</p>}
                </div>

                {/* Personal Identification */}
                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.firstName ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        First name *
                    </label>
                    <input 
                        type="text" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`} 
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.firstName}</p>}
                </div>

                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.lastName ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Last name *
                    </label>
                    <input 
                        type="text" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`} 
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.lastName}</p>}
                </div>

                {/* Regional Settings - District Dropdown */}
                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.district ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        District *
                    </label>
                    <select 
                        name="district" 
                        value={formData.district} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${errors.district ? 'border-red-500 focus:border-red-500' : ''}`}
                    >
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.district && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.district}</p>}
                </div>

                {/* Main City Dropdown */}
                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.city ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Main City *
                    </label>
                    <select 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        disabled={!formData.district || isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${errors.city ? 'border-red-500 focus:border-red-500' : ''}`}
                    >
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.city}</p>}
                </div>

                {/* Street Address */}
                <div className="md:col-span-2 group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${(errors.houseNumber || errors.laneStreet) ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Street Address *
                    </label>
                    <div className="space-y-3">
                        <div>
                            <input 
                                type="text" 
                                name="houseNumber" 
                                value={formData.houseNumber} 
                                onChange={handleInputChange} 
                                disabled={isLoading}
                                placeholder="House Number / Name" 
                                className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.houseNumber ? 'border-red-500 focus:border-red-500' : ''}`} 
                            />
                            {errors.houseNumber && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.houseNumber}</p>}
                        </div>
                        <div>
                            <input 
                                type="text" 
                                name="laneStreet" 
                                value={formData.laneStreet} 
                                onChange={handleInputChange} 
                                disabled={isLoading}
                                placeholder="Lane / Street" 
                                className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.laneStreet ? 'border-red-500 focus:border-red-500' : ''}`} 
                            />
                            {errors.laneStreet && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.laneStreet}</p>}
                        </div>
                        {showSaveProfileCheck && (
                            <div className="mt-4 flex items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <input
                                    type="checkbox"
                                    id="saveAddressToProfile"
                                    name="saveAddressToProfile"
                                    checked={formData.saveAddressToProfile || false}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                    className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                />
                                <label htmlFor="saveAddressToProfile" className={`ml-3 text-sm font-medium text-slate-700 ${isLoading ? 'opacity-50' : 'cursor-pointer'}`}>
                                    Save this address to my profile for future orders
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Phone Numbers */}
                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.phone ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Primary Phone *
                    </label>
                    <input 
                        type="text" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`} 
                        placeholder="07xxxxxx"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.phone}</p>}
                </div>

                <div className="group">
                    <label className={`block text-[13px] font-bold mb-2 uppercase tracking-wider transition-colors ${errors.secondaryPhone ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                        Secondary Phone (Optional)
                    </label>
                    <input 
                        type="text" 
                        name="secondaryPhone" 
                        value={formData.secondaryPhone} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        className={`w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${errors.secondaryPhone ? 'border-red-500 focus:border-red-500' : ''}`} 
                        placeholder="Alternative contact"
                    />
                    {errors.secondaryPhone && <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in">{errors.secondaryPhone}</p>}
                </div>

                {/* Additional Delivery Instructions */}
                <div className="md:col-span-2 group">
                    <label className="block text-[13px] font-bold mb-2 text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
                        Order notes (optional)
                    </label>
                    <textarea 
                        name="orderNotes" 
                        value={formData.orderNotes} 
                        onChange={handleInputChange} 
                        disabled={isLoading}
                        rows="3" 
                        placeholder="Special notes for delivery..." 
                        className="w-full px-[14px] py-[10px] bg-slate-50 border border-blue-200/60 rounded-[10px] text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm font-medium resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default BillingDetails;