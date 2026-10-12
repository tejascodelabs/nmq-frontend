import { useEffect, useState, useMemo } from 'react';
import AddStaffModal from '../../components/owner/AddStaffModal';
import { getStaffByShopIdApi, updateStaffStatusApi } from '../../api/staff.api';
import { Pencil } from 'lucide-react';

export default function StaffManagement({shopId}) {
  const currentShopId = shopId || localStorage.getItem('shopId');

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // Tab Navigation: all, active, suspended, archived
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modals & Selections
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [confirmSuspendStaff, setConfirmSuspendStaff] = useState(null);
  const [confirmArchiveStaff, setConfirmArchiveStaff] = useState(null);

  const normalizeStaff = (record) => ({
    ...record,
    full_name: record.name,
    mobile: record.mobileNo || '',
    role: record.subRole === 'counter' ? 'counter' : 'staff',
    staff_id: `STF-${String(record.id).padStart(4, '0')}`,
    created_at: record.createdAt,
    is_suspended: record.isSuspended,
    is_archived: record.isArchived,
  });

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getStaffByShopIdApi(currentShopId);
      setStaffList((response.data || []).map(normalizeStaff));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadStaff = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getStaffByShopIdApi(currentShopId);
        if (!cancelled) {
          setStaffList((response.data || []).map(normalizeStaff));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || 'Unable to load staff members');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStaff();
    return () => {
      cancelled = true;
    };
  }, [currentShopId]);

  // Stats Calculations
  const stats = useMemo(() => {
    return {
      total: staffList.length,
      active: staffList.filter((s) => !s.is_suspended).length,
      suspended: staffList.filter((s) => s.is_suspended).length,
      archived: staffList.filter((s) => s.is_archived).length,
      counter: staffList.filter((s) => s.role === 'counter').length,
      service: staffList.filter((s) => s.role === 'staff').length,
    };
  }, [staffList]);

  // Filtered List based on Search, Tab (Status), and Role
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staffList.filter((staff) => {
      const matchesSearch =
        !query ||
        staff.full_name.toLowerCase().includes(query) ||
        staff.staff_id.toLowerCase().includes(query) ||
        staff.mobile.includes(query);

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && !staff.is_suspended && !staff.is_archived) ||
        (activeTab === 'suspended' && staff.is_suspended && !staff.is_archived) ||
        (activeTab === 'archived' && staff.is_archived);

      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'counter' && staff.role === 'counter') ||
        (roleFilter === 'staff' && staff.role === 'staff');

      return matchesSearch && matchesTab && matchesRole;
    });
  }, [staffList, search, activeTab, roleFilter]);

  // Handlers for status actions
  const handleToggleSuspend = async () => {
    if (!confirmSuspendStaff) return;
    try {
      await updateStaffStatusApi(confirmSuspendStaff.id, {
        isSuspended: !confirmSuspendStaff.is_suspended,
      });
      setConfirmSuspendStaff(null);
      await fetchStaff();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update staff status');
    }
  };

  const handleToggleArchive = async () => {
    if (!confirmArchiveStaff) return;
    try {
      await updateStaffStatusApi(confirmArchiveStaff.id, {
        isArchived: !confirmArchiveStaff.is_archived,
        ...(confirmArchiveStaff.is_archived ? {} : { isSuspended: false }),
      });
      setConfirmArchiveStaff(null);
      await fetchStaff();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update staff status');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f5ef] text-[#2f211b] font-sans pb-12">
      {/* HEADER BAR */}
      <header className="w-full min-h-[88px] flex flex-wrap items-center justify-between gap-6 px-4 sm:px-8 py-4 bg-[#fffdf9] border-b border-[#e7dfd5]">
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold tracking-widest text-[#b65a38] uppercase">
            ADMINISTRATION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#2f211b] m-0 flex items-center gap-2">
            👥 Staff Management
          </h1>
          <p className="text-xs text-[#7d7067] mt-1 m-0">
            Manage your team members, permissions, and roles.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingStaff(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-[#bf4c2a] hover:bg-[#a33d20] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Add Staff Member
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-7">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-xl border border-[#e7dfd5] bg-[#fffdf9] p-8 text-center text-sm text-[#7d7067]">
            Loading staff members...
          </div>
        )}
        
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 border border-[#e7dfd5] rounded-xl bg-[#fffdf9] hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#937f73]">TOTAL STAFF</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-[#f9e7dc] text-[#bf4c2a]">👥</div>
            </div>
            <div className="text-2xl font-bold text-[#2f211b]">
              {String(stats.total).padStart(2, '0')}
            </div>
            <span className="text-[11px] text-[#8b7c72] mt-1 block">Registered employees</span>
          </div>

          <div className="p-4 border border-[#e7dfd5] rounded-xl bg-[#fffdf9] hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#937f73]">ACTIVE STAFF</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-[#e8f5ed] text-[#287a4b]">●</div>
            </div>
            <div className="text-2xl font-bold text-[#287a4b]">
              {String(stats.active).padStart(2, '0')}
            </div>
            <span className="text-[11px] text-[#8b7c72] mt-1 block">Authorized to log in</span>
          </div>

          <div className="p-4 border border-[#e7dfd5] rounded-xl bg-[#fffdf9] hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#937f73]">SUSPENDED</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-[#fee2e2] text-[#dc2626]">🔒</div>
            </div>
            <div className="text-2xl font-bold text-[#dc2626]">
              {String(stats.suspended).padStart(2, '0')}
            </div>
            <span className="text-[11px] text-[#8b7c72] mt-1 block">Temporarily restricted</span>
          </div>

          <div className="p-4 border border-[#e7dfd5] rounded-xl bg-[#fffdf9] hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#937f73]">ARCHIVED</span>
              <div className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-[#f1f2f4] text-[#6b7280]">🗄️</div>
            </div>
            <div className="text-2xl font-bold text-[#6b7280]">
              {String(stats.archived).padStart(2, '0')}
            </div>
            <span className="text-[11px] text-[#8b7c72] mt-1 block">Past staff accounts</span>
          </div>
        </div>

        {/* SEARCH, TAB NAVIGATION & FILTERS */}
        <section className="w-full mb-6 p-4 sm:p-5 bg-[#fffdf9] border border-[#e7dfd5] rounded-xl box-border">
          
          {/* TABS HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7dfd5] pb-3 mb-4">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {/* <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#bf4c2a] text-white shadow-sm'
                    : 'text-[#7d7067] hover:bg-[#f9f2eb]'
                }`}
              >
                All Staff ({stats.total}) */}
              {/* </button> */}
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'bg-[#287a4b] text-white shadow-sm'
                    : 'text-[#7d7067] hover:bg-[#f9f2eb]'
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                onClick={() => setActiveTab('suspended')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'suspended'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'text-[#7d7067] hover:bg-[#f9f2eb]'
                }`}
              >
                Suspended ({stats.suspended})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'archived'
                    ? 'bg-[#6b7280] text-white shadow-sm'
                    : 'text-[#7d7067] hover:bg-[#f9f2eb]'
                }`}
              >
                Archived ({stats.archived})
              </button>
            </div>

            <span className="text-xs text-[#8b7c72] font-semibold">
              Showing {filteredStaff.length} results
            </span>
          </div>

          {/* SEARCH & CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2.5">
            <div className="h-9 flex items-center px-3 border border-[#ded5cb] rounded-lg bg-white">
              <span className="mr-2 text-xs">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name, ID, or mobile number..."
                className="w-full border-none outline-none bg-transparent text-xs text-[#2f211b] placeholder-[#a4adba]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-2.5 border border-[#ded5cb] rounded-lg bg-white text-xs text-[#2f211b] outline-none cursor-pointer"
            >
              <option value="all">Role: All ({stats.total})</option>
              <option value="counter">Counter Staff ({stats.counter})</option>
              <option value="staff">Service Staff ({stats.service})</option>
            </select>

            {(search || roleFilter !== 'all' || activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setActiveTab('all');
                }}
                className="h-9 px-3 border border-[#ded5cb] rounded-lg bg-white text-[#dc2626] text-xs font-semibold hover:bg-[#fef2f2] cursor-pointer transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </section>

        {/* STAFF CARDS GRID */}
        {!loading && filteredStaff.length === 0 ? (
          <div className="w-full p-12 bg-[#fffdf9] border border-[#e7dfd5] rounded-xl text-center">
            <p className="text-4xl mb-2">👤</p>
            <p className="text-sm font-bold text-[#2f211b]">No staff members found</p>
            <p className="text-xs text-[#7d7067] mt-1">
              Try adjusting your search query or tab filters.
            </p>
          </div>
        ) : !loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`p-4 bg-[#fffdf9] border rounded-xl flex flex-col justify-between transition-all hover:shadow-md ${
                  staff.is_suspended
                    ? 'border-[#fca5a5] bg-[#fff5f5]'
                    : staff.is_archived
                    ? 'border-[#d1d5db] bg-[#f9fafb]'
                    : 'border-[#e7dfd5]'
                }`}
              >
                <div>
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#bf4c2a] text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {staff.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#2f211b] truncate m-0">
                          {staff.full_name}
                        </h3>
                        <p className="text-[11px] text-[#7d7067] m-0 font-medium">
                          {staff.role === 'counter' ? '🏪 Counter Staff' : '👥 Service Staff'}
                        </p>
                      </div>
                    </div>

                    {/* STATUS BADGE */}
                    {staff.is_archived ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f2f4] text-[#6b7280]">
                        Archived
                      </span>
                    ) : staff.is_suspended ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#dc2626] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5ed] text-[#287a4b] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#287a4b]"></span>
                        Active
                      </span>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="bg-[#f8f5ef] p-2.5 rounded-lg text-xs space-y-1 mb-4 border border-[#eae2d8]">
                    <div className="flex justify-between">
                      <span className="text-[#8b7c72]">Staff ID:</span>
                      <span className="font-semibold text-[#2f211b]">{staff.staff_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b7c72]">Mobile:</span>
                      <span className="font-semibold text-[#2f211b]">{staff.phoneNo}</span>
                    </div>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#f0e7df]">
                  <button
                    onClick={() => {
                      setEditingStaff(staff);
                      setShowAddModal(true);
                    }}
                    className="py-1.5 px-2 bg-white border border-[#e7dfd5] text-[#2f211b] text-xs font-semibold rounded-lg hover:bg-[#f8f5ef] cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>

                  <button
                    onClick={() => setSelectedStaff(staff)}
                    className="py-1.5 px-2 bg-white border border-[#e7dfd5] text-[#2f211b] text-xs font-semibold rounded-lg hover:bg-[#f8f5ef] cursor-pointer transition-colors"
                  >
                    👤 Profile
                  </button>

                  {!staff.is_archived ? (
                    <button
                      onClick={() => setConfirmSuspendStaff(staff)}
                      className={`py-1.5 px-2 border text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                        staff.is_suspended
                          ? 'bg-[#e8f5ed] border-[#a7f3d0] text-[#287a4b] hover:bg-[#d1fae5]'
                          : 'bg-[#fee2e2] border-[#fca5a5] text-[#dc2626] hover:bg-[#fecaca]'
                      }`}
                    >
                      {staff.is_suspended ? '🔓 Unsuspend' : '🔒 Suspend'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmArchiveStaff(staff)}
                      className="py-1.5 px-2 bg-[#e8f5ed] border border-[#a7f3d0] text-[#287a4b] text-xs font-semibold rounded-lg hover:bg-[#d1fae5] cursor-pointer transition-colors"
                    >
                      ♻️ Restore
                    </button>
                  )}

                  {!staff.is_archived && (
                    <button
                      onClick={() => setConfirmArchiveStaff(staff)}
                      className="col-span-2 py-1.5 px-2 bg-white border border-[#e7dfd5] text-[#6b7280] text-xs font-semibold rounded-lg hover:bg-[#f3f4f6] cursor-pointer transition-colors"
                    >
                      🗄️ Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* VIEW PROFILE MODAL */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#e7dfd5]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold font-serif text-[#2f211b] m-0">Staff Profile</h2>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-[#8b7c72] hover:text-[#2f211b] text-lg font-bold bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#bf4c2a] text-white text-2xl font-bold rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                {selectedStaff.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-base font-bold text-[#2f211b] m-0">{selectedStaff.full_name}</h3>
              <p className="text-xs text-[#7d7067] mt-0.5 m-0">
                {selectedStaff.role === 'counter' ? 'Counter Staff' : 'Service Staff'}
              </p>
            </div>

            <div className="space-y-2 bg-[#f8f5ef] p-4 rounded-xl border border-[#eae2d8] text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-[#e7dfd5]">
                <span className="text-[#8b7c72]">Staff ID</span>
                <span className="font-bold text-[#2f211b]">{selectedStaff.staff_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e7dfd5]">
                <span className="text-[#8b7c72]">Mobile Number</span>
                <span className="font-bold text-[#2f211b]">{selectedStaff.mobile}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e7dfd5]">
                <span className="text-[#8b7c72]">Joined Date</span>
                <span className="font-bold text-[#2f211b]">
                  {new Date(selectedStaff.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8b7c72]">Status</span>
                <span className="font-bold">
                  {selectedStaff.is_archived
                    ? 'Archived'
                    : selectedStaff.is_suspended
                    ? 'Suspended'
                    : 'Active'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedStaff(null)}
              className="w-full py-2.5 bg-[#f8f5ef] border border-[#e7dfd5] text-[#2f211b] font-bold text-xs rounded-xl hover:bg-[#eae2d8] cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SUSPEND CONFIRMATION MODAL */}
      {confirmSuspendStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-xl border border-[#e7dfd5]">
            <div className="w-12 h-12 bg-[#fee2e2] text-[#dc2626] rounded-full flex items-center justify-center text-xl mx-auto mb-3">
              {confirmSuspendStaff.is_suspended ? '🔓' : '🔒'}
            </div>
            <h3 className="text-base font-bold text-[#2f211b] m-0">
              {confirmSuspendStaff.is_suspended ? 'Activate Staff?' : 'Suspend Staff?'}
            </h3>
            <p className="text-xs text-[#7d7067] my-2">
              {confirmSuspendStaff.is_suspended
                ? `Are you sure you want to reactivate ${confirmSuspendStaff.full_name}?`
                : `Are you sure you want to suspend ${confirmSuspendStaff.full_name}? They will lose access to the system.`}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setConfirmSuspendStaff(null)}
                className="py-2 bg-white border border-[#e7dfd5] text-[#2f211b] text-xs font-bold rounded-xl hover:bg-[#f8f5ef] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleSuspend}
                className={`py-2 text-white text-xs font-bold rounded-xl cursor-pointer ${
                  confirmSuspendStaff.is_suspended ? 'bg-[#287a4b]' : 'bg-[#dc2626]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {confirmArchiveStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-xl border border-[#e7dfd5]">
            <div className="w-12 h-12 bg-[#f1f2f4] text-[#6b7280] rounded-full flex items-center justify-center text-xl mx-auto mb-3">
              🗄️
            </div>
            <h3 className="text-base font-bold text-[#2f211b] m-0">
              {confirmArchiveStaff.is_archived ? 'Restore Staff?' : 'Archive Staff?'}
            </h3>
            <p className="text-xs text-[#7d7067] my-2">
              {confirmArchiveStaff.is_archived
                ? `Restore ${confirmArchiveStaff.full_name} back to the active team list?`
                : `Archive ${confirmArchiveStaff.full_name}? They will be moved out of active lists.`}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setConfirmArchiveStaff(null)}
                className="py-2 bg-white border border-[#e7dfd5] text-[#2f211b] text-xs font-bold rounded-xl hover:bg-[#f8f5ef] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleArchive}
                className="py-2 bg-[#6b7280] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    {/* ADD STAFF MODAL NODE */}
      {showAddModal && (
        <AddStaffModal
          isOpen={showAddModal}
          shopId={currentShopId}
          staff={editingStaff}
          onClose={() => {
            setShowAddModal(false);
            setEditingStaff(null);
            fetchStaff(); // Refresh list after adding staff
          }}
        />
      )}
    </div>
  );
}