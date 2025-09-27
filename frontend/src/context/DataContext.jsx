import React, { createContext, useContext, useMemo, useState } from "react";
import { initialPrograms } from "../data/mockData.js";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [programs, setPrograms] = useState(initialPrograms);
  // giả lập user đã đăng nhập
  const [user, setUser] = useState({ id: "u_001", name: "Nguyễn Quốc Bảo", email: "bao@example.com" });

  const value = useMemo(() => ({ programs, setPrograms, user, setUser }), [programs, user]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
