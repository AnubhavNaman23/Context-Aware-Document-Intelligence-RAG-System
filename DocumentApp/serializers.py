from rest_framework import serializers
from .models import Document


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "file", "filename", "filetype", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at", "filename", "filetype"]

    def create(self, validated_data):
        if "file" in validated_data:
            f = validated_data["file"]
            name = getattr(f, "name", "")
            validated_data["filename"] = name
            ext = name.split(".")[-1].lower() if "." in name else ""
            mapping = {
                "pdf": "pdf", "docx": "docx", "doc": "docx",
                "txt": "txt", "pptx": "pptx", "ppt": "pptx",
                "csv": "csv", "jpg": "images", "jpeg": "images",
                "png": "images", "gif": "images",
            }
            validated_data["filetype"] = mapping.get(ext, "others")
        return Document.objects.create(**validated_data)
