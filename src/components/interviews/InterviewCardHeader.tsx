import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Clock, Video, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { INTERVIEW_STATUS_CONFIG } from "@/lib/pm-constants"
import type { Interview } from "@/lib/pm-types"

interface InterviewCardHeaderProps {
  interview: Interview
  onEdit: () => void
  onDelete: () => void
}

export function InterviewCardHeader({ interview, onEdit, onDelete }: InterviewCardHeaderProps) {
  const statusConfig = INTERVIEW_STATUS_CONFIG[interview.status]

  return (
    <div className="flex items-start justify-between w-full border-b-0 pb-0">
      <div className="flex-1 text-left">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">{interview.participantName || "Untitled Interview"}</h3>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {interview.conductedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(interview.conductedAt).toLocaleDateString()}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Uploaded {formatDistanceToNow(new Date(interview.uploadedAt), { addSuffix: true })}
          </div>
          {interview.videoUrl && (
            <a
              href={interview.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Video className="w-3 h-3" />
              Video
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
