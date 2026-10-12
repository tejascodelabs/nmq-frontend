import { useState } from 'react'
import Modal from '../../components/shared/Modal'
import InputField from '../../components/shared/InputField'
import { createStaffApi, updateStaffApi } from '../../api/staff.api'

export default function AddStaffModal({ isOpen, shopId, staff, onClose }) {
  const [form, setForm] = useState({
    full_name: staff?.full_name || '',
    email: staff?.email || '',
    phoneNo: staff?.phoneNo || '',
    role: staff?.subRole || (staff?.role === 'counter' ? 'counter' : 'serving'),
    password: '',
    confirm: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdStaffInfo, setCreatedStaffInfo] = useState(null)

  const set = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Basic client-side password validation
  const validatePassword = (pass) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(pass)
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.full_name.trim()) {
      return setError('Full name is required')
    }

    if (!form.email.trim()) {
      return setError('Email is required')
    }

    if (!staff && (!shopId || !Number.isInteger(Number(shopId)))) {
      return setError('A valid shop is required before adding staff')
    }

    if (!/^[6-9]\d{9}$/.test(form.phoneNo.trim())) {
      return setError('Enter a valid 10-digit phoneNo number')
    }

    if (!staff && !validatePassword(form.password)) {
      return setError(
        'Password must be at least 6 characters and contain uppercase, lowercase, number, and special character.'
      )
    }

    if (!staff && form.password !== form.confirm) {
      return setError('Passwords do not match')
    }

    setLoading(true)

    try {
      const staffData = {
        name: form.full_name.trim(),
        email: form.email.trim(),
        mobileNo: form.phoneNo.trim(),
        subRole: form.role,
        role: "staff",
      }

      if (staff) {
        await updateStaffApi(staff.id, staffData)
        handleModalClose()
        return
      }

      const response = await createStaffApi({
        shopId: Number(shopId),
        ...staffData,
        password: form.password,
      })

      setCreatedStaffInfo({
        staff_id: response.data?.id,
        password: form.password,
        name: response.data?.name || form.full_name,
      })
    } catch (error) {
      setError(error.response?.data?.message || `Unable to ${staff ? 'update' : 'create'} staff member`)
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setForm({
      full_name: '',
      email: '',
      phoneNo: '',
      role: 'serving',
      password: '',
      confirm: ''
    })
    setError('')
    setCreatedStaffInfo(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={staff ? 'Edit Staff Member' : 'Add Staff Member'}>
      {/* DECOY AUTOFILL FIELDS */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <input type="text" name="username" autoComplete="username" tabIndex={-1} />
        <input type="password" name="password" autoComplete="new-password" tabIndex={-1} />
      </div>

      {createdStaffInfo ? (
        /* SUCCESS CREDENTIALS DISPLAY */
        <div className="space-y-4 py-2">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-2xl">🎉</span>
            <h4 className="text-base font-bold text-emerald-900 mt-1">Staff Created Successfully!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Save these details or share them with {createdStaffInfo.name}.
            </p>
          </div>

          <div className="bg-[#f8f5ef] border border-[#e7dfd5] p-4 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Staff ID:</span>
              <span className="font-bold text-[#2f211b] bg-white px-2 py-1 rounded border border-[#e7dfd5]">
                {createdStaffInfo.staff_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Password:</span>
              <span className="font-bold text-[#2f211b] bg-white px-2 py-1 rounded border border-[#e7dfd5]">
                {createdStaffInfo.password}
              </span>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="w-full py-3 bg-[#bf4c2a] hover:bg-[#a33d20] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      ) : (
        /* FORM INPUTS */
        <div className="space-y-3">
          <InputField
            label="Full Name"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Enter full name"
            autoComplete="off"
            mandatory
          />

          <InputField
            label="Mobile Number"
            name="staff-contact-number"
            value={form.phoneNo}
            onChange={(e) => set('phoneNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit phoneNo"
            autoComplete="off"
            mandatory
          />

          <InputField
            label="Email"
            type="email"
            name="staff-email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="staff@example.com"
            autoComplete="email"
            mandatory
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#bf4c2a]/20 focus:border-[#bf4c2a] bg-white text-[#2f211b]"
            >
              <option value="serving">Serving Staff</option>
              <option value="counter">Counter Person</option>
            </select>
          </div>

          {!staff && (
            <>
              <InputField
                label="Password"
                type="password"
                name="new-staff-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Staff@123"
                autoComplete="new-password"
                mandatory
              />

              <InputField
                label="Confirm Password"
                type="password"
                name="new-staff-password-confirm"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                mandatory
              />
            </>
          )}

          {error && <p className="text-red-500 text-xs font-semibold mt-1">{error}</p>}

          <div className="flex flex-col gap-2.5 pt-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-[#bf4c2a] hover:bg-[#a33d20] disabled:bg-gray-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm disabled:cursor-not-allowed"
            >
              {loading ? (staff ? 'Saving...' : 'Adding...') : (staff ? 'SAVE CHANGES' : 'ADD STAFF')}
            </button>

            <button
              onClick={handleModalClose}
              className="w-full py-3 bg-white border border-[#e7dfd5] text-[#2f211b] hover:bg-[#f8f5ef] font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}