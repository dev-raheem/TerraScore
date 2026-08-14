import type { Metadata } from "next";
import { requireHr } from "@/lib/session";
import { getOffices } from "@/lib/attendance";
import AddOfficeForm from "./AddOfficeForm";
import OfficeTable from "./OfficeTable";

export const metadata: Metadata = { title: "Offices" };

export default async function AdminOfficesPage() {
  await requireHr();
  const offices = await getOffices();

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Offices</div>
          <div className="page-sub">Office locations and geofence radius used for attendance/presence · {offices.length} total</div>
        </div>
      </div>

      <AddOfficeForm />
      <OfficeTable offices={offices} />
    </>
  );
}
