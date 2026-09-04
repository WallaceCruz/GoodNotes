import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/board/model";

/** Valor do seletor que representa o padrão da conta, e não um projeto. */
export const ACCOUNT_SCOPE = "__account__";

/** Escolhe se os ajustes valem para a conta inteira ou para um projeto. */
export function AppearanceScopePicker({
  scope,
  projects,
  onChange,
}: {
  scope: string;
  projects: Project[];
  onChange: (scope: string) => void;
}) {
  return (
    <div className="w-60">
      <Label className="text-xs">Aplicar em</Label>
      <Select value={scope} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ACCOUNT_SCOPE}>Padrão da conta</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
