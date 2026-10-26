import json

from django.test import TestCase
from rest_framework.test import APIClient

from schemes.models import Scheme, SchemeContent


class SchemeApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_scheme_stores_name_and_empty_json_content(self):
        response = self.client.post('/api/schemes/', {'name': '  Поток оплаты  '}, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'Поток оплаты')
        content = SchemeContent.objects.get(scheme_id=response.data['id'])
        self.assertIsInstance(content.payload, str)
        self.assertEqual(json.loads(content.payload), {'nodes': [], 'edges': []})

    def test_search_schemes_by_name(self):
        Scheme.objects.create(name='Оплата заказа')
        Scheme.objects.create(name='Регистрация')

        response = self.client.get('/api/schemes/', {'search': 'опла'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['name'] for item in response.data], ['Оплата заказа'])

    def test_put_content_keeps_json_string_linked_to_scheme(self):
        created = self.client.post('/api/schemes/', {'name': 'Ветвление'}, format='json')
        scheme_id = created.data['id']
        graph = {
            'nodes': [
                {
                    'id': 'start',
                    'type': 'logic',
                    'position': {'x': 10, 'y': 20},
                    'data': {'kind': 'condition', 'label': 'Оплачен?'},
                }
            ],
            'edges': [
                {
                    'id': 'yes-edge',
                    'source': 'start',
                    'target': 'next',
                    'sourceHandle': 'yes',
                    'label': 'Да',
                }
            ],
        }

        saved = self.client.put(
            f'/api/schemes/{scheme_id}/content/',
            {'graph': graph},
            format='json',
        )
        loaded = self.client.get(f'/api/schemes/{scheme_id}/content/')

        self.assertEqual(saved.status_code, 200)
        self.assertEqual(loaded.status_code, 200)
        self.assertEqual(loaded.data['graph'], graph)
        payload = SchemeContent.objects.get(scheme_id=scheme_id).payload
        self.assertIsInstance(payload, str)
        self.assertIn('Оплачен?', payload)
        self.assertEqual(json.loads(payload)['edges'][0]['label'], 'Да')

    def test_reject_blank_name_and_broken_graph(self):
        blank = self.client.post('/api/schemes/', {'name': '   '}, format='json')
        created = self.client.post('/api/schemes/', {'name': 'Черновик'}, format='json')
        broken = self.client.put(
            f'/api/schemes/{created.data["id"]}/content/',
            {'graph': {'nodes': [{}], 'edges': []}},
            format='json',
        )

        self.assertEqual(blank.status_code, 400)
        self.assertEqual(broken.status_code, 400)

    def test_delete_scheme_removes_content(self):
        created = self.client.post('/api/schemes/', {'name': 'Временная'}, format='json')
        scheme_id = created.data['id']

        response = self.client.delete(f'/api/schemes/{scheme_id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Scheme.objects.filter(pk=scheme_id).exists())
        self.assertFalse(SchemeContent.objects.filter(scheme_id=scheme_id).exists())
