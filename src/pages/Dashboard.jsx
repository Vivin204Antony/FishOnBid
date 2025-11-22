export default function Dashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
  }

  return (
    <div className="p-10 text-3xl font-bold">
      Welcome to Dashboard! ✔
    </div>
  );
}
