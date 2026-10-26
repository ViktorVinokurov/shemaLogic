from django.shortcuts import get_object_or_404
from rest_framework import serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scheme, SchemeContent
from .serializers import SchemeGraphSerializer, SchemeSerializer, dump_graph, load_graph


class SchemeViewSet(viewsets.ModelViewSet):
    queryset = Scheme.objects.all()
    serializer_class = SchemeSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', '').strip()
        if not search:
            return queryset
        needle = search.casefold()
        matched_ids = [scheme.pk for scheme in queryset if needle in scheme.name.casefold()]
        return queryset.filter(pk__in=matched_ids)


class SchemeContentView(APIView):
    def get(self, request, scheme_id: int):
        content = get_object_or_404(SchemeContent, scheme_id=scheme_id)
        return Response(self._payload(content))

    def put(self, request, scheme_id: int):
        content = get_object_or_404(SchemeContent, scheme_id=scheme_id)
        serializer = SchemeGraphSerializer(data=request.data.get('graph'))
        serializer.is_valid(raise_exception=True)
        content.payload = dump_graph(serializer.validated_data)
        content.save()
        content.scheme.save(update_fields=['updated_at'])
        content.refresh_from_db()
        return Response(self._payload(content))

    def _payload(self, content: SchemeContent) -> dict:
        try:
            graph = load_graph(content.payload)
        except serializers.ValidationError as exc:
            raise ValidationError(detail=exc.detail) from exc
        return {
            'scheme_id': content.scheme_id,
            'graph': graph,
            'updated_at': content.updated_at,
        }
