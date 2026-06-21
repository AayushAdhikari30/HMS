from django.http import JsonResponse

def patients(request):
    return JsonResponse([
        {"id": 1, "name": "Test Patient", "age": 25},
        {"id": 2, "name": "Ram", "age": 30}
    ], safe=False)