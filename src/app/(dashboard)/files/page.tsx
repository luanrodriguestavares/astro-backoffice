import { FileUploadAction } from "@/components/resources/create-actions";
import { PageHeader } from "@/components/ui/page-header";
import { ResourceTable, date } from "@/components/ui/resource-table";
import { apiFetch } from "@/lib/api/server";
type FileRecord = { id: string; originalName: string; contentType: string; sizeBytes: number; status: string; createdAt: string };
export default async function FilesPage() { const files = await apiFetch<FileRecord[]>("/api/v1/files"); return <><PageHeader eyebrow="Conteúdo" title="Arquivos" description="Consulte imagens e documentos armazenados pela organização." actions={<FileUploadAction />} /><ResourceTable rows={files} empty="Nenhum arquivo enviado." columns={[{ label: "Arquivo", value: (row) => row.originalName }, { label: "Tipo", value: (row) => row.contentType }, { label: "Tamanho", value: (row) => `${Math.ceil(row.sizeBytes / 1024)} KB` }, { label: "Status", value: (row) => row.status }, { label: "Enviado em", value: (row) => date(row.createdAt) }]} /></>; }
