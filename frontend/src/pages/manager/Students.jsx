import ManagerUsers from "./Users.jsx";

export default function ManagerStudents() {
  return (
    <ManagerUsers
      title="Quản lý thí sinh"
      addButtonLabel="+ Thêm thí sinh"
      allowedRoles={["Thành viên"]}
    />
  );
}

