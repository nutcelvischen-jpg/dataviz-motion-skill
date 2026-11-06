"""
finetune_run.py
Fine-tuning Google Gemma using QLoRA (4-bit) on NVIDIA T4 (16GB VRAM) via Colab.
Compatible with google-colab-cli headless execution.
"""

import os
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

def main():
    print("=" * 60)
    print("🚀 Starting Gemma QLoRA Fine-tuning on Colab T4 GPU...")
    print("=" * 60)

    # 1. Check GPU Device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"✅ Device: {gpu_name} ({vram_gb:.2f} GB VRAM)")
    else:
        print("⚠️ Warning: CUDA not detected! Running on CPU will be extremely slow.")

    # 2. Model & Dataset Configuration
    # Gemma 2 2B is optimal for T4 (16GB VRAM), can also use "google/gemma-2-9b-it" with low batch size
    model_id = os.getenv("MODEL_ID", "google/gemma-2-2b-it")
    dataset_name = os.getenv("DATASET_NAME", "mlabonne/guanaco-llama2-1k")
    output_dir = "./gemma_finetuned_lora"

    print(f"📦 Target Model: {model_id}")
    print(f"📊 Training Dataset: {dataset_name}")

    # Hugging Face Authentication (optional, needed if model requires access approval)
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("ℹ️ Note: HF_TOKEN not set. If accessing gated models (like google/gemma-2-2b),")
        print("   ensure you have accepted terms on Hugging Face and exported HF_TOKEN.")

    # 3. 4-bit Quantization Configuration (Crucial for T4 16GB memory footprint)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,  # T4 natively supports FP16 (compute capability 7.5)
        bnb_4bit_use_double_quant=True,
    )

    # 4. Load Tokenizer
    print("🔄 Loading Tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        token=hf_token,
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # 5. Load Base Model in 4-bit
    print(f"🔄 Loading {model_id} with 4-bit NF4 Quantization...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        token=hf_token,
        trust_remote_code=True,
    )

    # Prepare model for PEFT/LoRA training
    model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False

    # 6. LoRA Configuration
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
    )

    # 7. Load & Prepare Dataset
    print(f"🔄 Loading dataset '{dataset_name}'...")
    dataset = load_dataset(dataset_name, split="train[:500]")  # sample 500 for demonstration

    # 8. Training Arguments (Configured for T4 16GB VRAM)
    try:
        # Modern trl (SFTConfig)
        training_args = SFTConfig(
            output_dir=output_dir,
            num_train_epochs=1,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            gradient_checkpointing=True,
            optim="paged_adamw_8bit",
            logging_steps=10,
            save_strategy="steps",
            save_steps=50,
            learning_rate=2e-4,
            fp16=True,   # T4 Turing architecture uses FP16
            bf16=False,  # T4 does NOT have native BF16 tensor core acceleration
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            dataset_text_field="text",
            max_seq_length=512,
            report_to="none",
        )
    except Exception:
        # Fallback for older trl versions
        from transformers import TrainingArguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=1,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            gradient_checkpointing=True,
            optim="paged_adamw_8bit",
            logging_steps=10,
            save_strategy="steps",
            save_steps=50,
            learning_rate=2e-4,
            fp16=True,
            bf16=False,
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            report_to="none",
        )

    # 9. Initialize SFTTrainer
    print("🛠️ Initializing SFTTrainer...")
    try:
        trainer = SFTTrainer(
            model=model,
            train_dataset=dataset,
            peft_config=peft_config,
            processing_class=tokenizer,
            args=training_args,
        )
    except TypeError:
        trainer = SFTTrainer(
            model=model,
            train_dataset=dataset,
            peft_config=peft_config,
            tokenizer=tokenizer,
            args=training_args,
        )

    # 10. Start Training
    print("⚡ Starting Training...")
    trainer.train()

    # 11. Save LoRA Adapters & Tokenizer
    print(f"💾 Saving fine-tuned LoRA adapter to '{output_dir}'...")
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    print("=" * 60)
    print("🎉 Fine-tuning Completed Successfully!")
    print(f"📁 Adapters saved at: {output_dir}")
    print("=" * 60)

if __name__ == "__main__":
    main()
