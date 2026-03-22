import BottomNav from "./BottomNav";
import ChatButton from "../chat/ChatButton";

export default function MainLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 64 }}>
      <main style={{ padding: 16 }}>{children}</main>
      <BottomNav />
      <ChatButton />
    </div>
  );
}
