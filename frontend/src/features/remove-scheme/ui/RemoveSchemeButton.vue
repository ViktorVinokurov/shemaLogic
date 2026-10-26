<script setup lang="ts">
import { Trash2Icon } from '@lucide/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSchemeStore, type Scheme } from '@/entities/scheme'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

const props = defineProps<{
  scheme: Scheme
}>()

const store = useSchemeStore()
const router = useRouter()
const open = ref(false)
const error = ref('')
const isRemoving = ref(false)

async function confirm() {
  if (isRemoving.value) return
  isRemoving.value = true
  error.value = ''
  try {
    const wasActive = await store.removeScheme(props.scheme.id)
    open.value = false
    if (wasActive) await router.push({ name: 'editor' })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось удалить схему.'
  } finally {
    isRemoving.value = false
  }
}
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    class="cursor-pointer text-muted-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
    :aria-label="`Удалить схему ${scheme.name}`"
    @click="open = true"
  >
    <Trash2Icon />
  </Button>

  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Удалить схему?</DialogTitle>
        <DialogDescription>
          «{{ scheme.name }}» и её блоки будут удалены из базы.
        </DialogDescription>
      </DialogHeader>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <DialogFooter>
        <Button type="button" variant="outline" :disabled="isRemoving" @click="open = false">
          Отмена
        </Button>
        <Button type="button" variant="destructive" :disabled="isRemoving" @click="confirm">
          Удалить
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
