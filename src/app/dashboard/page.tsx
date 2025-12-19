// ... (Các import và interface giữ nguyên như code của bạn)

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ 
    candidate_count: '...', 
    source_distribution: [] 
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ... (useEffect giữ nguyên)

  const renderRoleSpecificDashboard = () => {
    const colorMap: any = {
      admin: "border-red-200 bg-red-50 text-red-700",
      manager: "border-amber-200 bg-amber-50 text-amber-700",
      recruiter: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
    const currentTheme = colorMap[user_group?.toLowerCase() || ''] || "border-gray-200 bg-gray-50 text-gray-700";

    return (
      <div className="space-y-6">
        {/* --- Card 1: Tổng quan số lượng --- */}
        <div className={`p-5 border-2 rounded-2xl shadow-sm ${currentTheme}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-bold opacity-70 tracking-wider">Phạm vi truy cập</p>
              <h2 className="text-xl font-black">{user_group}</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black leading-none">{stats.candidate_count}</span>
              <p className="text-xs font-bold opacity-70">ỨNG VIÊN</p>
            </div>
          </div>
        </div>

        {/* --- Card 2: KHUNG BIỂU ĐỒ NGUỒN ỨNG VIÊN --- */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-inner">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Biểu đồ nguồn ứng viên
            </h4>
          </div>

          {statsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {stats.source_distribution.length > 0 ? (
                stats.source_distribution.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold text-gray-600 group-hover:text-blue-700 transition-colors">
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        {item.count} <span className="text-[10px] text-gray-400 font-normal">UV</span> 
                        <span className="ml-2 text-blue-600">({item.percentage}%)</span>
                      </span>
                    </div>
                    
                    {/* Thanh Progress Bar - Tiền thân của biểu đồ ngang */}
                    <div className="w-full bg-white border border-gray-100 rounded-full h-2.5 overflow-hidden shadow-sm">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400 text-sm italic">Chưa có dữ liệu phân tích</p>
                </div>
              )}
            </div>
          )}
          
          <p className="mt-6 text-[10px] text-center text-gray-400 font-medium italic">
            * Dữ liệu được tính toán dựa trên quyền {stats.applied_permission || 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  // ... (Phần return chính giữ nguyên vì layout 2 cột của bạn đã rất ổn)
  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SECTION 1: USER INFO */}
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center flex flex-col justify-center border border-white">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl text-gray-500 font-medium">Chào mừng trở lại,</h1>
          <p className="text-3xl mb-10 font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight">
            {name}
          </p>
          <div className="space-y-3">
            <Link href="/candidates" className="group flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-bold tracking-wide">
              <span>Quản lý Ứng viên</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/profile" className="block w-full bg-white border-2 border-indigo-100 text-indigo-600 py-3.5 rounded-xl hover:bg-indigo-50 transition-all font-bold">
              Thông tin hồ sơ
            </Link>
            <button onClick={logout} className="w-full text-red-400 py-3 rounded-xl hover:text-red-600 transition-colors text-sm font-bold">
              Đăng xuất tài khoản
            </button>
          </div>
        </div>

        {/* SECTION 2: STATS & SOURCE CHART (Cột chứa Khung Biểu đồ) */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-white flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-gray-400 uppercase tracking-widest text-xs font-black">Báo cáo dữ liệu</h3>
             <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
          </div>
          {renderRoleSpecificDashboard()}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
