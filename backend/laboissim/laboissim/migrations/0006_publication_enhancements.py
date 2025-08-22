# Generated manually for publication enhancements

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('laboissim', '0005_exterieurs'),
    ]

    operations = [
        migrations.AddField(
            model_name='publication',
            name='tagged_members',
            field=models.ManyToManyField(blank=True, related_name='tagged_publications', to='auth.user'),
        ),
        migrations.AddField(
            model_name='publication',
            name='tagged_externals',
            field=models.ManyToManyField(blank=True, related_name='tagged_publications', to='laboissim.exterieurs'),
        ),
        migrations.AddField(
            model_name='publication',
            name='attached_files',
            field=models.ManyToManyField(blank=True, related_name='publications', to='laboissim.userfile'),
        ),
        migrations.AddField(
            model_name='publication',
            name='keywords',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
