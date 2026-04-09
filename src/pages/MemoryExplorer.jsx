import { Brain, FolderTree, Upload } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function MemoryExplorer() {
  return (
    <div>
      <Breadcrumbs />
      <EmptyState
        icon={Brain}
        title="Memory Explorer"
        description="Three-panel layout: DrDroid-style nav tree, memory browser with search and folder list, memory detail card with provenance trail. Built in P16-P17."
        actions={[
          { label: 'Create Memory' },
          { label: 'Import from Runbook' },
        ]}
      />
    </div>
  )
}
