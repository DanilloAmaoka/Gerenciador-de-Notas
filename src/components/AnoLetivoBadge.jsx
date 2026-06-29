import { useSchoolData } from "../context/SchoolDataContext";

export default function AnoLetivoBadge() {
  const { anoLetivoAtual } = useSchoolData();

  return (
    <div className="year-badge" data-tour="ano-letivo-atual">
      <span>Ano letivo atual</span>
      <strong>{anoLetivoAtual}</strong>
    </div>
  );
}
