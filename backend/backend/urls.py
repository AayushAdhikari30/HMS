from django.contrib import admin
from django.urls import path
from HMS import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/patients/', views.patients),
]