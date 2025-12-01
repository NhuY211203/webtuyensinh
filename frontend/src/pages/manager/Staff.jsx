import ManagerUsers from "./Users.jsx";

export default function ManagerStaff() {
  return (
    <ManagerUsers
      title="Quản lý nhân sự"
      addButtonLabel="+ Thêm nhân sự"
      allowedRoles={["Tư vấn viên", "Người phụ trách"]}
    />
  );
}

