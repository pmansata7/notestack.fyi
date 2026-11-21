export function MeetingNotepadPreview() {
  return (
    <div className="ns-notepad" aria-hidden>
      <div className="ns-notepad-chrome">
        <span className="ns-notepad-dot" />
        <span className="ns-notepad-dot" />
        <span className="ns-notepad-dot" />
        <span className="ns-notepad-title">Q3 roadmap sync</span>
        <span className="ns-notepad-live">Live</span>
      </div>
      <div className="ns-notepad-body">
        <p className="ns-notepad-label">Your bullets</p>
        <ul className="ns-notepad-list ns-notepad-manual">
          <li>ICP focus — finance &amp; ops only this quarter</li>
          <li>Deals stalling at business case — need template</li>
        </ul>
        <p className="ns-notepad-label ns-notepad-label-ai">Enhanced · local AI</p>
        <ul className="ns-notepad-list">
          <li>
            <strong>ICP alignment</strong> — team agreed to pause SMB campaigns until the ICP doc
            ships.
          </li>
          <li>
            <strong>Next steps</strong> — Rob scopes business case template by Tuesday; CS shares
            proof points.
          </li>
        </ul>
      </div>
    </div>
  )
}