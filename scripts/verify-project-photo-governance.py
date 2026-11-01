#!/usr/bin/env python3
"""Fail a release when project-photo evidence can bypass private intake or review."""
from pathlib import Path

migration=Path("supabase/migrations/20261101114000_landshop_project_photo_evidence_intake.sql").read_text()
view=Path("apps/dashboard/app/admin/properties/project-media/ProjectPhotoEvidence.tsx").read_text()
route=Path("apps/dashboard/app/admin/properties/project-media/page.tsx").read_text()
projects=Path("apps/website/app/projects/[slug]/page.tsx").read_text()
checks={
 "Private photo bucket": "('landshop-project-evidence','landshop-project-evidence',false" in migration,
 "Staff identity gate": "landshop_staff_can_work" in migration and "landshop_staff_can_work" in route,
 "Independent review": "v_photo.uploaded_by=v_user" in migration,
 "Management review gate": "landshop_is_management(v_user)" in migration,
 "Photo originals remain in private storage": "from('landshop-project-evidence')" in view,
 "Public site keeps its independently curated media": "landshop_project_photo_evidence" not in projects,
 "Rights evidence required": "p_rights_reference" in migration and "p_attested" in migration,
 "Audit submission and review": "project.photo.submitted" in migration and "project.photo.reviewed" in migration,
 "Uploads do not automatically publish": "update public.estates" not in migration and "status='published'" not in migration,
 "No ambiguous sales photo claims": "No website photo has been published" in view,
}
for label,ok in checks.items():
 print(("PASS" if ok else "FAIL")+" "+label)
if not all(checks.values()):
 raise SystemExit("Project photo governance check failed")
