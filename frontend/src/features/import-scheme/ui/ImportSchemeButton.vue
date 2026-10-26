<script setup lang="ts">
import { ClipboardPasteIcon } from '@lucide/vue'
import { useId, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { insertSchemeDocument } from '../model/insert'

defineProps<{
  compact?: boolean
}>()

const router = useRouter()
const open = ref(false)
const source = ref('')
const error = ref('')
const isSubmitting = ref(false)
const sourceId = useId()
const fileRef = useTemplateRef<HTMLInputElement>('fileInput')

watch(open, (isOpen) => {
  if (isOpen) return
  source.value = ''
  error.value = ''
  if (fileRef.value) fileRef.value.value = ''
})

function readFile(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    source.value = typeof reader.result === 'string' ? reader.result : ''
    error.value = ''
  }
  reader.onerror = () => {
    error.value = 'Не удалось прочитать файл.'
  }
  reader.readAsText(file)
}

async function submit() {
  if (isSubmitting.value || !source.value.trim()) return
  isSubmitting.value = true
  error.value = ''
  try {
    await insertSchemeDocument(source.value, router)
    open.value = false
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось вставить схему.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Button
    type="button"
    variant="outline"
    :size="compact ? 'icon' : 'sm'"
    :aria-label="compact ? 'Вставить схему из JSON' : undefined"
    title="Вставить схему из JSON"
    @click="open = true"
  >
    <ClipboardPasteIcon />
    <span v-if="!compact">Вставить</span>
  </Button>

  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <form class="grid gap-4" @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>Вставить схему</DialogTitle>
          <DialogDescription>
            Вставьте JSON, выгруженный из редактора, или выберите файл. Схема появится в списке слева.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-2">
          <div class="flex items-center justify-between gap-2">
            <Label :for="sourceId">JSON</Label>
            <Button type="button" variant="ghost" size="sm" :disabled="isSubmitting" @click="fileRef?.click()">
              Выбрать файл
            </Button>
          </div>
          <textarea
            :id="sourceId"
            v-model="source"
            rows="10"
            spellcheck="false"
            placeholder='{"name":"Оплата заказа","graph":{"nodes":[],"edges":[]}}'
            class="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 max-h-72 min-h-40 w-full resize-y rounded-lg border px-2.5 py-2 font-mono text-xs outline-none focus-visible:ring-3"
            :disabled="isSubmitting"
          />
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="readFile"
          >
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="open = false">
            Отмена
          </Button>
          <Button type="submit" :disabled="isSubmitting || !source.trim()">
            Вставить
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
