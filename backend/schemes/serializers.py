import json

from rest_framework import serializers

from .models import Scheme, SchemeContent

EMPTY_GRAPH = {'nodes': [], 'edges': []}


def dump_graph(graph: dict) -> str:
    return json.dumps(graph, ensure_ascii=False, separators=(',', ':'))


def load_graph(payload: str) -> dict:
    try:
        graph = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise serializers.ValidationError('Содержание схемы повреждено.') from exc
    if not isinstance(graph, dict):
        raise serializers.ValidationError('Содержание схемы должно быть объектом.')
    graph.setdefault('nodes', [])
    graph.setdefault('edges', [])
    return graph


class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError('Введите название схемы.')
        return name

    def create(self, validated_data):
        scheme = super().create(validated_data)
        SchemeContent.objects.create(scheme=scheme, payload=dump_graph(EMPTY_GRAPH))
        return scheme


class SchemeGraphSerializer(serializers.Serializer):
    nodes = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    edges = serializers.ListField(child=serializers.DictField(), allow_empty=True)

    def validate_nodes(self, nodes):
        for node in nodes:
            if 'id' not in node or 'position' not in node or 'data' not in node:
                raise serializers.ValidationError('У блока нет id, position или data.')
            data = node['data']
            if not isinstance(data, dict) or 'kind' not in data or 'label' not in data:
                raise serializers.ValidationError('У блока нет kind или label.')
            position = node['position']
            if not isinstance(position, dict) or 'x' not in position or 'y' not in position:
                raise serializers.ValidationError('У блока нет координат.')
        return nodes

    def validate_edges(self, edges):
        for edge in edges:
            if 'id' not in edge or 'source' not in edge or 'target' not in edge:
                raise serializers.ValidationError('У связи нет id, source или target.')
        return edges
