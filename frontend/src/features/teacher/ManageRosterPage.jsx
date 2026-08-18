import { useParams } from "react-router-dom";
import ClassRosterForm from "./components/ClassRosterForm";

function ManageRosterPage() {
  const { id } = useParams();
  return <ClassRosterForm mode="edit" classId={id} />;
}

export default ManageRosterPage;
