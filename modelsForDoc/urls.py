from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from DocumentApp.views import (
    DocumentUploadView,
    DocumentListView,
    DocumentDeleteView,
    AskQuestionView,
    DocumentReindexView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/upload-doc/", DocumentUploadView.as_view(), name="upload-doc"),
    path("api/documents/", DocumentListView.as_view(), name="documents-list"),
    path("api/documents/<int:id>/delete/", DocumentDeleteView.as_view(), name="document-delete"),
    path("api/documents/reindex/", DocumentReindexView.as_view(), name="documents-reindex"),
    path("api/ask-question/", AskQuestionView.as_view(), name="ask-question"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
