import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageUploadFieldProps {
  label: string;
  field: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  uploading: boolean;
}

export default function ImageUploadField({ label, field, value, onChange, uploading }: ImageUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label} Image (Optional)</Label>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onChange(e, field)}
          className="text-xs"
          disabled={uploading}
        />
        {uploading && (
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        )}
      </div>
      {value && <img src={value} alt="Preview" className="h-16 w-16 object-cover rounded border" />}
    </div>
  );
}
